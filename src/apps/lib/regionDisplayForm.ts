/**
 * Form plumbing the two region display editors share: the profile editor
 * (apps/DDBRegionDisplayProfiles) and the per-region / per-behavior editor
 * (apps/DDBRegionDisplayConfig).
 */

/** Pixel size of one grid square in the two previews: the strip and the single enlarged square. */
export const PREVIEW_GRID = 50;
export const PREVIEW_GRID_LARGE = 150;

/** The form's current values, as Foundry's FormDataExtended reads them. */
export function readForm<T>(element: HTMLElement | null | undefined): Partial<T> {
  if (!element) return {};
  const FormDataExtended = (
    foundry.applications.ux as unknown as {
      FormDataExtended: new (form: HTMLFormElement) => { object: Partial<T> };
    }
  ).FormDataExtended;
  return new FormDataExtended(element as HTMLFormElement).object;
}

/**
 * Run `handler` on every `input` event in the window: range, number and colour inputs fire
 * it while typing or dragging, which keeps the previews live. The frame element survives
 * re-renders, so the listener is bound once per frame.
 */
export function bindLiveInput(element: HTMLElement | null | undefined, handler: () => void): void {
  if (!element || element.dataset.ddbiInputBound) return;
  element.dataset.ddbiInputBound = "true";
  element.addEventListener("input", handler);
}

function trimmed(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * The colour an editor stores. A null colour inherits (the region's own, or the profile's),
 * which a checkbox chooses; the colour picker only exists while that box is unticked, so
 * unticking it brings back the last custom colour seen rather than deriving the box from a
 * colour that was never chosen. When the form does not show the box at all, the current
 * colour decides.
 */
export function resolveColor({
  picked,
  current,
  lastCustom,
  inherit,
}: {
  /** The colour picker's value, when it is shown. */
  picked: unknown;
  /** The colour the draft holds now; null inherits. */
  current: string | null | undefined;
  /** The last explicit colour, remembered across ticking and unticking the box. */
  lastCustom: string;
  /** The inherit checkbox, when the form shows it. */
  inherit: boolean | undefined;
}): { color: string | null; lastCustom: string } {
  const own = trimmed(current);
  const remembered = trimmed(picked) ?? own ?? lastCustom;
  const inherits = inherit ?? own === null;
  return { color: inherits ? null : remembered, lastCustom: remembered };
}
