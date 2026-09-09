// @vitest-environment jsdom
// The preview panel next to each munch button. It is parented to <body> rather than to the muncher
// because the window content scrolls and (in the dark theme) carries a backdrop-filter, either of
// which would clip it; these tests pin the hover lifecycle that parenting makes fiddly.

import SourceSelectionPreview from "../../src/apps/lib/SourceSelectionPreview";

const SELECTION: IMuncherEffectiveSources = {
  categories: [
    {
      id: 1,
      name: "Core Rules",
      books: [
        { id: 2, code: "PHB", name: "Player's Handbook" },
        { id: 5, code: "MM", name: "Monster Manual" },
      ],
    },
    { id: 2, name: "Expanded Rules", books: [{ id: 27, code: "XGE", name: "Xanathar's Guide" }] },
  ],
  bookCount: 3,
  bookFilterActive: false,
  ignoredBooks: [],
};

function buildPreview(selection: IMuncherEffectiveSources = SELECTION) {
  const getSelection = vi.fn(() => selection);
  const preview = new SourceSelectionPreview(getSelection);
  const button = document.createElement("button");
  document.body.append(button);
  preview.attach(button);
  return { preview, button, getSelection };
}

function hover(button: HTMLElement) {
  button.dispatchEvent(new Event("pointerenter"));
}

function unhover(button: HTMLElement) {
  button.dispatchEvent(new Event("pointerleave"));
}

describe("SourceSelectionPreview", () => {

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("opens on hover with the current selection and closes when the pointer leaves", async () => {
    vi.useFakeTimers();
    const { preview, button } = buildPreview();

    hover(button);
    const panel = preview.panel!;
    expect(panel).not.toBeNull();
    expect(panel.parentElement).toBe(document.body);
    expect(panel.querySelectorAll(".ddb-source-preview-category")).toHaveLength(2);
    expect(Array.from(panel.querySelectorAll("li")).map((li) => li.textContent))
      .toEqual(["Player's Handbook", "Monster Manual", "Xanathar's Guide"]);
    expect(panel.querySelector(".ddb-source-preview-header .hint")?.textContent)
      .toBe("2 categories, 3 books");

    unhover(button);
    vi.advanceTimersByTime(SourceSelectionPreview.HIDE_DELAY_MS);
    expect(preview.visible).toBe(false);
    expect(document.querySelector(".ddb-source-preview")).toBeNull();
  });

  it("stays open while the pointer is inside the panel, so it can be scrolled", () => {
    vi.useFakeTimers();
    const { preview, button } = buildPreview();

    hover(button);
    const panel = preview.panel!;
    // the pointer crosses the gap to the panel before the grace period is up
    unhover(button);
    vi.advanceTimersByTime(SourceSelectionPreview.HIDE_DELAY_MS / 2);
    panel.dispatchEvent(new Event("pointerenter"));
    vi.advanceTimersByTime(SourceSelectionPreview.HIDE_DELAY_MS * 4);
    expect(preview.visible).toBe(true);

    panel.dispatchEvent(new Event("pointerleave"));
    vi.advanceTimersByTime(SourceSelectionPreview.HIDE_DELAY_MS);
    expect(preview.visible).toBe(false);
  });

  it("re-reads the selection on every hover", () => {
    const { preview, button, getSelection } = buildPreview();

    hover(button);
    preview.hide();
    hover(button);

    expect(getSelection).toHaveBeenCalledTimes(2);
  });

  it("reuses one panel when hovering a second button", () => {
    const { preview, button } = buildPreview();
    const second = document.createElement("button");
    document.body.append(second);
    preview.attach(second);

    hover(button);
    hover(second);

    expect(document.querySelectorAll(".ddb-source-preview")).toHaveLength(1);
  });

  it("reports the book filter and the entries it cannot apply", () => {
    const { preview, button } = buildPreview({
      ...SELECTION,
      bookFilterActive: true,
      ignoredBooks: ["Tasha's Cauldron of Everything", "Volo's Guide to Monsters"],
    });

    hover(button);
    const notes = Array.from(preview.panel!.querySelectorAll(".ddb-source-preview-note"))
      .map((note) => note.textContent);

    expect(notes[0]).toContain("Book filter on");
    expect(notes[1]).toContain("Tasha's Cauldron of Everything, Volo's Guide to Monsters");
  });

  it("says so when nothing is selected", () => {
    const { preview, button } = buildPreview({
      categories: [], bookCount: 0, bookFilterActive: false, ignoredBooks: [],
    });

    hover(button);

    expect(preview.panel!.querySelector(".ddb-source-preview-empty")?.textContent)
      .toContain("only homebrew can be imported");
  });

  it("closes on click, on blur and on destroy, leaving nothing on the body", () => {
    const { preview, button } = buildPreview();

    hover(button);
    button.dispatchEvent(new Event("click"));
    expect(preview.visible).toBe(false);

    button.dispatchEvent(new Event("focus"));
    expect(preview.visible).toBe(true);
    button.dispatchEvent(new Event("blur"));
    expect(preview.visible).toBe(false);

    hover(button);
    preview.destroy();
    expect(document.body.querySelector(".ddb-source-preview")).toBeNull();
  });

  it("closes when the page scrolls or the window resizes under it", () => {
    const { preview, button } = buildPreview();

    hover(button);
    window.dispatchEvent(new Event("resize"));
    expect(preview.visible).toBe(false);

    hover(button);
    document.dispatchEvent(new Event("scroll"));
    expect(preview.visible).toBe(false);
  });

  it("stays open when its own body is scrolled", () => {
    const { preview, button } = buildPreview();

    hover(button);
    const body = preview.panel!.querySelector(".ddb-source-preview-body")!;
    // scroll does not bubble, so the listener catching the muncher scrolling also sees this one
    body.dispatchEvent(new Event("scroll", { bubbles: false }));

    expect(preview.visible).toBe(true);
  });

  it("survives a scrollbar drag that leaves the panel, and closes when it is released outside", () => {
    vi.useFakeTimers();
    const { preview, button } = buildPreview();

    hover(button);
    const panel = preview.panel!;
    panel.dispatchEvent(new Event("pointerenter"));
    panel.dispatchEvent(new Event("pointerdown"));
    // dragging the scrollbar drifts off the panel while the button is still held
    panel.dispatchEvent(new Event("pointerleave"));
    vi.advanceTimersByTime(SourceSelectionPreview.HIDE_DELAY_MS * 4);
    expect(preview.visible).toBe(true);

    document.dispatchEvent(new Event("pointerup"));
    vi.advanceTimersByTime(SourceSelectionPreview.HIDE_DELAY_MS);
    expect(preview.visible).toBe(false);
  });

  it("keeps the panel open when a drag is released back inside it", () => {
    vi.useFakeTimers();
    const { preview, button } = buildPreview();

    hover(button);
    const panel = preview.panel!;
    panel.dispatchEvent(new Event("pointerenter"));
    panel.dispatchEvent(new Event("pointerdown"));
    document.dispatchEvent(new Event("pointerup"));
    vi.advanceTimersByTime(SourceSelectionPreview.HIDE_DELAY_MS * 4);

    expect(preview.visible).toBe(true);
  });

  it("keeps the panel inside the viewport and prefers to sit above the button", () => {
    const { preview, button } = buildPreview();
    // jsdom does not lay out, so feed the measurements the positioner asks for
    button.getBoundingClientRect = () => ({ left: 700, right: 900, top: 500, bottom: 530, width: 200, height: 30 }) as DOMRect;
    const panelRect = { left: 0, right: 400, top: 0, bottom: 300, width: 400, height: 300 } as DOMRect;

    hover(button);
    const panel = preview.panel!;
    panel.getBoundingClientRect = () => panelRect;
    preview.show(button);

    // centred on the button, and above it: 500 - 300 - 8
    expect(panel.style.left).toBe("600px");
    expect(panel.style.top).toBe("192px");

    // no room above, so it drops below the button
    button.getBoundingClientRect = () => ({ left: 10, right: 210, top: 20, bottom: 50, width: 200, height: 30 }) as DOMRect;
    preview.show(button);
    expect(panel.style.top).toBe("58px");
    // and is clamped to the left margin rather than hanging off the edge
    expect(panel.style.left).toBe("8px");
  });

});
