// Rendering decisions shared by tests and the bundled 3-D view.
export function createFrameBudget() {
  let scale=1,slow=0,fast=0;
  return {get scale(){return scale;},sample(ms){
    if(!Number.isFinite(ms)||ms<=0||ms>150)return scale;
    slow=ms>25?slow+1:0;fast=ms<17?fast+1:0;
    if(slow>=60){scale=Math.max(0.65,scale-0.15);slow=0;fast=0;}
    if(fast>=240){scale=Math.min(1,scale+0.15);fast=0;slow=0;}
    return scale;
  }};
}
export function fitDistance(size,aspect,fov=45){
  const halfAngle=Math.tan(fov*Math.PI/360);
  return Math.max(size[1]/2/halfAngle,size[0]/2/(halfAngle*Math.max(0.1,aspect)))*1.15+size[2]/2;
}
