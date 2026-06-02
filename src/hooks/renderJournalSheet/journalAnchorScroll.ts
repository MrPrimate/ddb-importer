// Pure DOM helpers for the journal anchor re-scroll fix. Kept dependency-free
// (no dnd5e / _module chain) so they can be unit-tested in the node vitest env.

/**
 * Images within `root` that have not finished loading. Core's JournalEntrySheet
 * scrolls to an anchor before images load, so images above the heading shift it
 * down afterwards (the pin lands mid-page). `naturalHeight === 0` catches images
 * that report `complete` but have not produced layout yet.
 */
export function getPendingImages(root: Element | null | undefined): HTMLImageElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll("img"))
    .filter((img) => !img.complete || img.naturalHeight === 0);
}

/**
 * Resolve once the image settles (load OR error - a broken/404 image must not
 * block the scroll). Listeners are removed on settle.
 */
export function waitForImage(img: HTMLImageElement): Promise<void> {
  return new Promise<void>((resolve) => {
    const done = () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      resolve();
    };
    img.addEventListener("load", done);
    img.addEventListener("error", done);
  });
}
