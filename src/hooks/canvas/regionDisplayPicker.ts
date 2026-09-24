import RegionDisplayProfiles from "../../lib/RegionDisplayProfiles";

/**
 * The profile picker shared by the activity behaviors and the Region config: a select of
 * the world's profiles beside a gear that opens the profile editor.
 *
 * The editor is reached through the module api rather than imported, which keeps this file
 * (and the behavior data models that use it) free of the application tree.
 */

interface IProfileEditorApp {
  open(options?: { profileId?: string | null }): unknown;
}

function profileEditor(): IProfileEditorApp | null {
  const api = (
    game.modules.get("ddb-importer") as
      | { api?: { apps?: { DDBRegionDisplayProfiles?: IProfileEditorApp } } }
      | undefined
  )?.api;
  return api?.apps?.DDBRegionDisplayProfiles ?? null;
}

/**
 * Whether this user may change the profiles. They are a world setting, which Foundry lets only
 * SETTINGS_MODIFY users write (by default the full Game Master, not an assistant), so this is
 * the same test the settings sheet applies to a restricted menu.
 */
export function canEditProfiles(): boolean {
  return game.user?.can("SETTINGS_MODIFY") === true;
}

/** Open the profile editor on a profile, when the api has registered it. */
export function openProfileEditor(profileId: string | null = null): void {
  profileEditor()?.open({ profileId });
}

export interface IProfilePickerConfig {
  name: string;
  value?: unknown;
  /** Label for the empty choice; omit for none. */
  blank?: string;
  disabled?: boolean;
}

export function profileOptions(blank: string | undefined): { value: string; label: string }[] {
  const options = RegionDisplayProfiles.choices();
  return blank === undefined ? options : [{ value: "", label: blank }, ...options];
}

/**
 * The localized heading a profile lists under, or "" for the blank choice. The system icon
 * presets carry their category in the id (`damage-fire`, `status-prone`); the shipped `damage`
 * and `status` profiles have no suffix, so they stay under general.
 */
export function profileGroup(id: string): string {
  if (!id) return "";
  let group = "general";
  if (!RegionDisplayProfiles.isBuiltinId(id)) group = "custom";
  else if (id.startsWith("damage-")) group = "damage";
  else if (id.startsWith("status-")) group = "status";
  return RegionDisplayProfiles.localize(`profileGroups.${group}`);
}

/** Profile options under a heading per group (general, damage, status, custom), in `all()` order. */
export function profileOptionGroups(blank: string | undefined) {
  const groups = new Map<string, { value: string; label: string }[]>();
  for (const option of profileOptions(blank)) {
    const group = profileGroup(option.value);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(option);
  }
  return [...groups].map(([label, options]) => ({ label, options }));
}

const GEAR_CLASS = "ddbi-display-region-picker-edit";

function appendOption(
  select: HTMLSelectElement | HTMLOptGroupElement,
  option: { value: string; label: string },
  current: string,
): void {
  const element = document.createElement("option");
  element.value = option.value;
  element.textContent = option.label;
  if (option.value === current) {
    // the attribute as well as the property: dnd5e's activity sheet serialises behavior
    // fields to HTML before rendering, and only the attribute survives that
    element.selected = true;
    element.setAttribute("selected", "");
  }
  select.append(element);
}

function appendGroups(select: HTMLSelectElement, blank: string | undefined, current: string): void {
  for (const group of profileOptionGroups(blank)) {
    const parent = group.label ? document.createElement("optgroup") : select;
    if (parent instanceof HTMLOptGroupElement) {
      parent.label = group.label;
      select.append(parent);
    }
    for (const option of group.options) appendOption(parent, option, current);
  }
}

/**
 * Build the select + gear pair. Usable as a dnd5e `customizeField` `data.input` or standalone.
 * The gear has no listener of its own (see the serialisation note above); the document-level
 * delegate from `installProfilePickerDelegate` handles every gear on the page. Users who
 * cannot save profiles get the select alone.
 */
export function createProfilePicker(config: IProfilePickerConfig): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.classList.add("ddbi-display-region-picker");
  const select = document.createElement("select");
  select.name = config.name;
  if (config.disabled) select.disabled = true;
  const current = typeof config.value === "string" ? config.value : "";
  appendGroups(select, config.blank, current);
  wrapper.append(select);
  if (!canEditProfiles()) return wrapper;
  const gear = document.createElement("button");
  gear.type = "button";
  gear.classList.add(GEAR_CLASS);
  gear.dataset.tooltip = "Edit region display profiles";
  gear.setAttribute("aria-label", "Edit region display profiles");
  gear.innerHTML = `<i class="fa-solid fa-gears" inert></i>`;
  wrapper.append(gear);
  return wrapper;
}

let delegateInstalled = false;

/** Open the editor from any picker gear on the page, on the profile its select shows. */
export function onProfilePickerClick(event: Event): void {
  const target = event.target as Element | null;
  const gear = target?.closest?.(`.${GEAR_CLASS}`);
  if (!gear) return;
  event.preventDefault();
  event.stopPropagation();
  const select = gear.closest(".ddbi-display-region-picker")?.querySelector<HTMLSelectElement>("select");
  openProfileEditor(select?.value || null);
}

/** Register the delegated gear handler once per page. */
export function installProfilePickerDelegate(root: Document = document): void {
  if (delegateInstalled) return;
  delegateInstalled = true;
  root.addEventListener("click", onProfilePickerClick);
}

/**
 * Refresh the options of every picker in a rendered element after the store changed,
 * keeping the current selection when it still exists.
 */
export function refreshProfilePickers(root: ParentNode, blank: string | undefined): void {
  for (const select of root.querySelectorAll<HTMLSelectElement>(".ddbi-display-region-picker select")) {
    const current = select.value;
    select.replaceChildren();
    appendGroups(select, blank, current);
  }
}
