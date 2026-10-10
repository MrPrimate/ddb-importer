const SELECTOR = "select[data-ddb-compendium-mapping]";

/**
 * Disables, in every compendium mapping select, the compendiums another select has already
 * taken, so one compendium can only be chosen for a single setting. "- None -" stays available.
 * @param {HTMLElement} root element holding the selects
 */
export function refreshCompendiumMappingSelects(root: HTMLElement) {
  const selects = Array.from(root.querySelectorAll<HTMLSelectElement>(SELECTOR));
  for (const select of selects) {
    const taken = new Set(selects.filter((other) => other !== select && other.value !== "").map((other) => other.value));
    for (const option of Array.from(select.options)) {
      // never the select's own value: a disabled selected option is dropped from the form data, which
      // would silently clear a mapping that already clashes instead of reporting it
      option.disabled = option.value !== "" && option.value !== select.value && taken.has(option.value);
    }
  }
}

/**
 * Keeps the compendium mapping selects under root mutually exclusive as the user changes them.
 * @param {HTMLElement} root element holding the selects
 */
export function wireCompendiumMappingSelects(root: HTMLElement) {
  for (const select of Array.from(root.querySelectorAll<HTMLSelectElement>(SELECTOR))) {
    select.addEventListener("change", () => refreshCompendiumMappingSelects(root));
  }
  refreshCompendiumMappingSelects(root);
}

/**
 * Describes the clashes in a set of submitted compendium mappings for a notification.
 * @param {ICompendiumDuplicateGroup[]} groups duplicate groups from findDuplicateMappings
 * @param {Record<string, string>} titles setting key -> display title
 * @returns {string} e.g. "Classes, Feats"; empty when there are no clashes
 */
export function describeDuplicateMappings(groups: ICompendiumDuplicateGroup[], titles: Record<string, string>): string {
  return groups
    .map((group) => group.settings.map((setting) => titles[setting] ?? setting).join(", "))
    .join("; ");
}
