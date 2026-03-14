export function multiSelectHover() {

  // @ts-expect-error - I know
  const originalRefresh = foundry.applications.elements.HTMLMultiSelectElement.prototype._refresh;
  // @ts-expect-error - I know
  foundry.applications.elements.HTMLMultiSelectElement.prototype._refresh = function() {
    originalRefresh.call(this);
    if (!this.classList.contains("ddb-source-select")) return;
    const select = this.querySelector("select");
    for (const tag of this.querySelectorAll(".tags .tag")) {
      const key = tag.dataset.key;
      const option = select?.querySelector(`option[value="${CSS.escape(key)}"]`);
      if (option?.dataset.tooltip) {
        tag.querySelector("span").dataset.tooltip = option.dataset.tooltip;
      }
    }
  };
}
