import DDBIconPicker from "../../apps/DDBIconPicker";
import { utils } from "../../lib/_module";
import { searchWords } from "../../lib/IconCatalogSearch.mjs";

/** The slice of a document the scope gate and image update read. */
interface IIconBrowserDocument {
  documentName?: string;
  name?: string;
  _source?: { name?: string };
  update?: (data: Record<string, unknown>) => Promise<unknown>;
}

/** The slice of an item, effect or dnd5e pseudo-document sheet this hook reads. */
interface IIconBrowserSheet {
  document?: IIconBrowserDocument | null;
  item?: IIconBrowserDocument | null;
  isEditable?: boolean;
  element?: HTMLElement;
  form?: HTMLFormElement | null;
  options?: { form?: { submitOnChange?: boolean } };
}

/** Foundry's `<file-picker>` element; its `value` setter updates the inner input. */
type TPickerElement = HTMLElement & { value: string };

type TIconTarget = HTMLImageElement | TPickerElement;

const IMAGE_SELECTOR = "img[data-action=\"editImage\"][data-edit]";
const PICKER_SELECTOR = "file-picker[type=\"image\"]";

let bound = false;

/**
 * The image control a click landed on. Sheets only carry these hooks while unlocked: a locked
 * dnd5e item header swaps `editImage` for `showIcon`, and a read-only sheet disables its
 * file pickers, so the sheet's lock state needs no separate check.
 */
export function findIconTarget(eventTarget: EventTarget | null): TIconTarget | null {
  if (!(eventTarget instanceof Element)) return null;
  const image = eventTarget.closest<HTMLImageElement>(IMAGE_SELECTOR);
  if (image) return image;
  const picker = eventTarget.closest<TPickerElement>(PICKER_SELECTOR);
  if (!picker || picker.hasAttribute("disabled")) return null;
  return picker;
}

/**
 * Items (including class features, spells and feats), their activities and other item-owned
 * pseudo-documents, and active effects. Actor and token art is left to Tokenizer.
 */
export function isIconBrowserSheet(app: IIconBrowserSheet | null | undefined): boolean {
  if (!app || app.isEditable === false) return false;
  const documentName = app.document?.documentName;
  if (documentName === "Actor" || documentName === "Token") return false;
  if (documentName === "Item" || documentName === "ActiveEffect") return true;
  return app.item?.documentName === "Item";
}

/** Mirrors core `DocumentSheetV2#onEditImage`, updating the document when the node has gone. */
function chooseImage(app: IIconBrowserSheet, image: HTMLImageElement, path: string) {
  const attr = image.dataset.edit!;
  if (image.isConnected && app.form && app.options?.form?.submitOnChange) {
    image.src = path;
    app.form.dispatchEvent(new Event("submit", { cancelable: true }));
    return;
  }
  void app.document?.update?.({ [attr]: path });
}

/** A rerender between opening the browser and choosing replaces the picker, so find it again. */
function choosePickerValue(app: IIconBrowserSheet, picker: TPickerElement, path: string) {
  const name = picker.getAttribute("name");
  const current = picker.isConnected
    ? picker
    : [...(app.element?.querySelectorAll<TPickerElement>(PICKER_SELECTOR) ?? [])].find(
      (element) => name && element.getAttribute("name") === name,
    );
  if (!current) return;
  current.value = path;
  current.dispatchEvent(new Event("input", { bubbles: true }));
  current.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * The starting search for a sheet: its own document's name, else the owning item's. The stored
 * name is read because dnd5e fills an unnamed activity's `name` with its type ("Attack", "Heal").
 */
export function iconSearchTerm(app: IIconBrowserSheet): string {
  const document = app.document;
  for (const name of [document?._source ? document._source.name : document?.name, app.item?.name]) {
    const search = searchWords(name);
    if (search) return search;
  }
  return "";
}

/** The icon browser's callback and search, or null when this click should fall through to the sheet. */
export function iconBrowserSelection(
  event: MouseEvent,
): { select: (path: string) => void; search: string } | null {
  if (!event.shiftKey) return null;
  const target = findIconTarget(event.target);
  if (!target) return null;
  const appId = target.closest(".application")?.id;
  const app = appId
    ? (foundry.applications.instances.get(appId) as unknown as IIconBrowserSheet | undefined)
    : undefined;
  if (!app || !isIconBrowserSheet(app)) return null;
  const select = target instanceof HTMLImageElement
    ? (path: string) => chooseImage(app, target, path)
    : (path: string) => choosePickerValue(app, target, path);
  return { select, search: iconSearchTerm(app) };
}

/**
 * Shift-clicking an unlocked item, activity or effect image opens the icon browser instead of the
 * file picker. One capture-phase listener on the body runs ahead of every sheet's own action
 * handler and covers sheets rendered later. With the setting off no listener is bound at all; the
 * setting requires a reload, so it is only read here.
 */
export function registerIconBrowserShiftClick() {
  if (!utils.getSetting<boolean>("icon-browser-shift-click")) return;
  if (bound) return;
  bound = true;
  document.body.addEventListener(
    "click",
    (event) => {
      if (!event.shiftKey) return;
      const selection = iconBrowserSelection(event);
      if (!selection) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      void new DDBIconPicker(selection.select, { search: selection.search }).render({ force: true });
    },
    true,
  );
}
