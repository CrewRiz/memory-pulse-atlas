// <memory-atlas-widget src="memory-atlas-embed.html" height="420"></memory-atlas-widget>
// The widget is the --embed page in a sandboxed frame: it runs its own scripts and can reach nothing else, not the
// page around it, not the network (the embed page's own policy), not the top window.
//   <script type="module" src="https://unpkg.com/memory-pulse-atlas/src/widget.js"></script>  or  import "memory-pulse-atlas/widget"
export function widgetFrame({ src, height = 420, title = "Memory atlas" } = {}) {
  if (typeof src !== "string" || !src || /^\s*(javascript|data|vbscript):/i.test(src)) throw new Error("memory-atlas-widget: src must be the address of an embed page");
  const attrs = { src, sandbox: "allow-scripts", loading: "lazy", title, referrerPolicy: "no-referrer", allow: "", style: { width: "100%", height: `${Number(height) || 420}px`, border: "0", display: "block", borderRadius: "8px" } };
  if (typeof document === "undefined") return attrs;
  const f = document.createElement("iframe");
  for (const [k, v] of Object.entries(attrs)) if (k === "style") Object.assign(f.style, v); else f[k] = v;
  f.setAttribute("sandbox", attrs.sandbox);
  return f;
}

if (typeof customElements !== "undefined" && !customElements.get("memory-atlas-widget")) {
  customElements.define("memory-atlas-widget", class extends HTMLElement {
    static get observedAttributes() { return ["src", "height", "title"]; }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { if (this.isConnected) this.render(); }
    render() {
      try { this.replaceChildren(widgetFrame({ src: this.getAttribute("src"), height: this.getAttribute("height") ?? 420, title: this.getAttribute("title") ?? "Memory atlas" })); }
      catch (e) { this.textContent = e.message; }
    }
  });
}
