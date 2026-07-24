export function multiSelectHover() {

  // _refresh is not exposed on the HTMLMultiSelectElement type
  const proto = foundry.applications.elements.HTMLMultiSelectElement.prototype as unknown as { _refresh: () => void };
  const originalRefresh = proto._refresh;
  proto._refresh = function(this: HTMLElement) {
    originalRefresh.call(this);
    if (!this.classList.contains("ddb-source-select")) return;
    const select = this.querySelector("select");
    for (const tag of this.querySelectorAll<HTMLElement>(".tags .tag")) {
      const key = tag.dataset.key;
      if (!key) continue;
      const option = select?.querySelector<HTMLElement>(`option[value="${CSS.escape(key)}"]`);
      const span = tag.querySelector<HTMLElement>("span");
      if (option?.dataset.tooltip && span) {
        span.dataset.tooltip = option.dataset.tooltip;
      }
    }
  };
}
