// Stable interior packing for the shipped cortex mesh.
import { BRAIN_SHELL_B64 } from './brain-shell.js';
let cached, contains;
function interiorSlots() {
  if (cached) return cached;
  const glb=Uint8Array.from(atob(BRAIN_SHELL_B64),c=>c.charCodeAt(0));
  const len=new DataView(glb.buffer).getUint32(12,true), json=JSON.parse(new TextDecoder().decode(glb.subarray(20,20+len))), bin=glb.subarray(28+len);
  const prim=json.meshes.find(m=>m.name==='Cortex').primitives[0];
  const read=id=>{const a=json.accessors[id],v=json.bufferViews[a.bufferView],start=(v.byteOffset||0)+(a.byteOffset||0),count=a.count*(a.type==='VEC3'?3:1);const Type=a.componentType===5126?Float32Array:a.componentType===5125?Uint32Array:Uint16Array;return new Type(bin.buffer.slice(bin.byteOffset+start,bin.byteOffset+start+count*Type.BYTES_PER_ELEMENT));};
  const p=read(prim.attributes.POSITION),idx=read(prim.indices),slots=[];
  // Bucket the mesh's projected triangles so interior checks stay cheap during relaxation.
  const bins=new Map(),cell=0.04,binKey=(y,z)=>Math.floor(y/cell)+':'+Math.floor(z/cell);
  for(let k=0;k<idx.length;k+=3){
    const ids=[idx[k]*3,idx[k+1]*3,idx[k+2]*3];
    for(let y=Math.floor(Math.min(...ids.map(i=>p[i+1]))/cell);y<=Math.floor(Math.max(...ids.map(i=>p[i+1]))/cell);y++)
      for(let z=Math.floor(Math.min(...ids.map(i=>p[i+2]))/cell);z<=Math.floor(Math.max(...ids.map(i=>p[i+2]))/cell);z++){
        const key=y+':'+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(k);
      }
  }
  function intersections(y,z){
    const xs=[];
    for(const k of bins.get(binKey(y,z))||[]){
      const a=idx[k]*3,b=idx[k+1]*3,c=idx[k+2]*3;
      const ay=p[a+1],az=p[a+2],by=p[b+1],bz=p[b+2],cy=p[c+1],cz=p[c+2];
      const det=(by-ay)*(cz-az)-(bz-az)*(cy-ay);if(Math.abs(det)<1e-12)continue;
      const u=((y-ay)*(cz-az)-(z-az)*(cy-ay))/det,v=((by-ay)*(z-az)-(bz-az)*(y-ay))/det;
      if(u>=0&&v>=0&&u+v<=1)xs.push(p[a]+u*(p[b]-p[a])+v*(p[c]-p[a]));
    }
    return xs.sort((a,b)=>a-b);
  }
  contains=point=>{const [x,y,z]=point.map(v=>v/2),xs=intersections(y,z);for(let k=0;k+1<xs.length;k+=2)if(x>xs[k]+0.002&&x<xs[k+1]-0.002)return true;return false;};
  let seed=1701;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // Continuous, deterministic samples have no repeated planes or crystal-like spacing.
  while(slots.length<14000){
    const y=-0.23+random()*0.53,z=-0.44+random()*0.88,x=-0.5+random(),point=[x*2,y*2,z*2];
    if(contains(point))slots.push(point);
  }
  cached=slots.sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);
  return cached;
}
const hash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const distance=(p,q)=>p.reduce((s,v,k)=>s+(v-q[k])**2,0);
const sourceKey=(a,n)=>a.sources[n.src]?.path ?? a.sources[n.src]?.name ?? '';
const noteKey=(a,n)=>JSON.stringify([sourceKey(a,n),n.id]);

export function packBrain(a, previous=null) {
  const slots=interiorSlots(),positions=new Array(a.notes.length),used=new Set(),old=new Map(),fixed=new Set();
  if(previous)previous.notes.forEach(n=>{if(n.brain)old.set(noteKey(previous,n),n.brain);});
  const slotIndex=new Map(slots.map((p,i)=>[p.join(','),i]));
  a.notes.forEach((n,j)=>{const p=old.get(noteKey(a,n));if(p){positions[j]=p.slice();fixed.add(j);const s=slotIndex.get(p.join(','));if(s!=null)used.add(s);}});
  const groups=new Map();
  const territory=n=>n.region || sourceKey(a,n);
  a.notes.forEach((n,j)=>{const key=territory(n);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(j);});
  const regions={...(previous?.brainLayout?.regions||{})};
  let start=0;
  for(const key of [...groups.keys()].sort()) {
    if(!regions[key]) regions[key]=previous ? [0,1] : [start/a.notes.length,(start+groups.get(key).length)/a.notes.length];
    start+=groups.get(key).length;
  }
  for(const key of [...groups.keys()].sort()){
    const ids=groups.get(key),region=regions[key],available=[];
    for(let i=Math.floor(region[0]*slots.length);i<Math.ceil(region[1]*slots.length);i++)available.push(i);
    const topics=new Map();
    ids.forEach(j=>{const t=a.knowledge?.neighborhoods?.find(r=>r.members.includes(j))?.id ?? a.notes[j].topic;if(!topics.has(t))topics.set(t,[]);topics.get(t).push(j);});
    const anchors=[];
    const order=[...topics.keys()].sort((x,y)=>(a.topics?.[x]?.name||[String(x)]).join(',').localeCompare((a.topics?.[y]?.name||[String(y)]).join(',')));
    for(const topic of order){
      const members=topics.get(topic),held=members.filter(j=>positions[j]);let center;
      if(held.length)center=[0,1,2].map(k=>held.reduce((s,j)=>s+positions[j][k],0)/held.length);
      else{
        // Farthest-site anchors spread topics across the source's fixed interior region.
        let best=available[Math.floor(available.length/2)] ?? 0,score=-1;
        for(const i of available){const d=anchors.length ? Math.min(...anchors.map(p=>distance(slots[i],p))) : -distance(slots[i],[0,0.08,0]);if(d>score || score===-1){score=d;best=i;}}
        center=slots[best];
      }
      anchors.push(center);
      const pending=members.filter(j=>!positions[j]).sort((x,y)=>String(a.notes[x].id).localeCompare(String(a.notes[y].id)));
      for(const j of pending){
        const h=hash(noteKey(a,a.notes[j])),target=center.map((v,k)=>v+(((h>>>(k*9))&511)/511-.5)*0.22);
        let best=-1,score=Infinity;
        for(const i of available){if(used.has(i))continue;const d=distance(slots[i],target);if(d<score){score=d;best=i;}}
        // A full territory borrows vacant interior slots; it never enlarges the brain.
        if(best<0)for(let i=0;i<slots.length;i++){if(used.has(i))continue;const d=distance(slots[i],target);if(d<score){score=d;best=i;}}
        if(best<0)best=h%slots.length; // beyond lattice capacity, co-location is explicit and bounded
        used.add(best);positions[j]=slots[best].slice();
      }
    }
  }
  relaxSynapses(a,positions,fixed);
  return {positions,regions,bounds:[[-1.04,-0.98,-0.92],[1.04,0.62,0.92]],capacity:slots.length,overlap:Math.max(0,a.notes.length-slots.length)};
}

function relaxSynapses(a,positions,fixed){
  const adjacency=a.notes.map(()=>[]),anchors=positions.map(p=>p.slice());
  for(const l of a.links||[]){if(!positions[l.a]||!positions[l.b]||l.a===l.b)continue;const w=(l.type==='thread'?0.35:1)*(a.notes[l.a].region && a.notes[l.a].region!==a.notes[l.b].region ? 0.15 : 1);adjacency[l.a].push([l.b,w]);adjacency[l.b].push([l.a,w]);}
  for(const [i,j] of a.across||[]){if(!positions[i]||!positions[j])continue;adjacency[i].push([j,0.18]);adjacency[j].push([i,0.18]);}
  const cell=0.08,cellAt=p=>p.map(v=>Math.floor(v/cell));
  for(let iter=0;iter<36;iter++){
    const grid=new Map();positions.forEach((p,j)=>{const key=cellAt(p).join(':');if(!grid.has(key))grid.set(key,[]);grid.get(key).push(j);});
    const next=positions.map((p,j)=>{
      if(fixed.has(j))return p;
      const delta=[0,0,0],nbr=adjacency[j],total=nbr.reduce((s,n)=>s+n[1],0)||1;
      for(const [other,w] of nbr){const q=positions[other],d=Math.sqrt(distance(p,q)),rest=0.075+(hash(a.notes[j].id+a.notes[other].id)%100)/2000;if(d<1e-8)continue;for(let k=0;k<3;k++)delta[k]+=(q[k]-p[k])*(d-rest)/d*w/total*0.24;}
      // A soft anchor preserves the topic neighborhood; local repulsion creates irregular open space.
      for(let k=0;k<3;k++)delta[k]+=(anchors[j][k]-p[k])*0.008;
      const c=cellAt(p),spacing=0.037+(hash(a.notes[j].id)%100)/5000;
      for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
        for(const other of grid.get([c[0]+x,c[1]+y,c[2]+z].join(':'))||[]){if(other===j)continue;const q=positions[other],d=Math.sqrt(distance(p,q));if(d>spacing||d<1e-9)continue;for(let k=0;k<3;k++)delta[k]+=(p[k]-q[k])/d*(spacing-d)*0.23;}
      }
      const len=Math.hypot(...delta),scale=len>0.035?0.035/len:1;
      for(const fraction of [1,0.5,0.2]){const q=p.map((v,k)=>v+delta[k]*scale*fraction);if(contains(q))return q;}
      return p;
    });
    next.forEach((p,j)=>positions[j]=p);
  }
}
