// @vitest-environment jsdom
// The import details overlay is position: absolute; inset: 0 over the muncher's
// window-content, so on the short tabs (feats, backgrounds, species) it is taller
// than the auto-height window and gets clipped. These pin the height reservation:
// grow on munch start, restore the pre-munch height when the overlay is dismissed.

import { readFileSync } from "node:fs";
import DDBMuncher from "../../src/apps/DDBMuncher";

const DETAILS_MARKUP = readFileSync("handlebars/muncher/details.hbs", "utf8");
const MARKUP = `<div class="window-content"><button id="munch-feats-start"></button>${DETAILS_MARKUP}</div>`;

const ROW_IDS = [
  "munching-task-name",
  "munching-task-monster",
  "munching-task-notes",
  "munching-task-import",
  "munching-task-overall",
];

// DDBMuncher's element and position come from ApplicationV2 (private fields), so
// exercise the methods against a plain stand-in holding the rendered markup
function buildApp(height: number | "auto" = "auto") {
  const element = document.createElement("div");
  element.id = "ddb-importer-monsters";
  element.innerHTML = MARKUP;
  const app = {
    element,
    position: { width: 880, height },
    preMunchHeight: null,
    setPosition: vi.fn((position: { height: number | "auto" }) => {
      app.position.height = position.height;
    }),
    _doEnableButtons: vi.fn(),
    stopAutoRotateMessage: vi.fn(),
    pendingSettingUpdates: 0,
    _enableButtons: DDBMuncher.prototype._enableButtons,
    clearProgressBars: DDBMuncher.prototype.clearProgressBars,
    clearDetails: DDBMuncher.prototype.clearDetails,
    _disableButtons: DDBMuncher.prototype._disableButtons,
    _expandForDetails: DDBMuncher.prototype._expandForDetails,
    _restoreAfterDetails: DDBMuncher.prototype._restoreAfterDetails,
  };
  return app as unknown as DDBMuncher & { setPosition: ReturnType<typeof vi.fn> };
}

function isActive(app: DDBMuncher): boolean {
  return app.element.classList.contains("munching-active");
}

function fillRows(app: DDBMuncher) {
  for (const id of ROW_IDS) {
    (app.element.querySelector(`#${id}`) as HTMLElement).textContent = `${id} text`;
  }
  const bar = app.element.querySelector(".munching-progress-primary .munching-progress-bar") as HTMLElement;
  bar.style.width = "50%";
}

function rowText(app: DDBMuncher): string[] {
  return ROW_IDS.map((id) => (app.element.querySelector(`#${id}`) as HTMLElement).textContent ?? "");
}

describe("DDBMuncher import details sizing", () => {

  it("reserves height when a munch starts", () => {
    const app = buildApp();

    app._disableButtons();

    expect(isActive(app)).toBe(true);
    expect(app.setPosition).toHaveBeenCalledWith({ height: "auto" });
    // the overlay itself still has to be visible for the space to be worth reserving
    expect(app.element.querySelector(".ddb-muncher-details")!.classList.contains("munching-details-hidden"))
      .toBe(false);
  });

  it("restores a manually resized height when the overlay is dismissed", async () => {
    const app = buildApp(640);

    app._disableButtons();
    expect(app.position.height).toBe("auto");

    await DDBMuncher.closeDetails.call(app, null, null);

    expect(isActive(app)).toBe(false);
    expect(app.position.height).toBe(640);
    expect(app.preMunchHeight).toBe(null);
  });

  it("restores auto height when the window was never resized", async () => {
    const app = buildApp();

    app._disableButtons();
    await DDBMuncher.closeDetails.call(app, null, null);

    expect(app.position.height).toBe("auto");
    expect(app.preMunchHeight).toBe(null);
  });

  it("does not lose the pre-munch height across repeated starts in one run", () => {
    const app = buildApp(640);

    app._disableButtons();
    // a second munch action before the overlay is dismissed must not capture the
    // grown "auto" height as the value to restore
    app._disableButtons();

    expect(app.preMunchHeight).toBe(640);
  });

  it("blanks the status rows when the overlay is dismissed", async () => {
    const app = buildApp();

    app._disableButtons();
    fillRows(app);
    await DDBMuncher.closeDetails.call(app, null, null);

    expect(rowText(app)).toEqual(["", "", "", "", ""]);
  });

  it("blanks the previous run's text when the next munch starts", () => {
    const app = buildApp();

    app._disableButtons();
    fillRows(app);
    // the user starts the next import without dismissing the overlay
    app._disableButtons();

    expect(rowText(app)).toEqual(["", "", "", "", ""]);
    const bar = app.element.querySelector(".munching-progress-primary .munching-progress-bar") as HTMLElement;
    expect(bar.style.width).toBe("0%");
  });

  it("keeps the completion summary visible until Okay is clicked", async () => {
    const app = buildApp();
    const okay = app.element.querySelector<HTMLButtonElement>("#munch-details-okay")!;
    const start = app.element.querySelector<HTMLButtonElement>("#munch-feats-start")!;
    app._disableButtons();
    expect(okay.disabled).toBe(true);
    expect(start.disabled).toBe(true);
    fillRows(app);

    app._enableButtons();

    expect(app.munching).toBe(false);
    expect(app.detailsOpen).toBe(true);
    expect(okay.disabled).toBe(false);
    expect(okay.classList.contains("munching-hidden")).toBe(false);
    expect(start.disabled).toBe(true);
    expect(rowText(app)[0]).toBe("munching-task-name text");
    expect(app._doEnableButtons).not.toHaveBeenCalled();

    await DDBMuncher.closeDetails.call(app, null, null);

    expect(app.detailsOpen).toBe(false);
    expect(app._doEnableButtons).toHaveBeenCalledOnce();
    expect(app.element.querySelector(".ddb-muncher-details")!.classList.contains("munching-details-hidden"))
      .toBe(true);
  });

  it("preserves live progress and the Okay button through a direct render", () => {
    const app = buildApp();
    app._disableButtons();
    fillRows(app);
    app._enableButtons();
    const prior = app.element.querySelector<HTMLElement>(".ddb-muncher-details")!;
    const replacement = document.createElement("div");
    replacement.innerHTML = DETAILS_MARKUP;
    const next = replacement.firstElementChild as HTMLElement;
    // Foundry's part sync base is not modelled by the minimal ApplicationV2 stub.
    const base = Object.getPrototypeOf(Object.getPrototypeOf(DDBMuncher.prototype));
    const original = base._preSyncPartState;
    base._preSyncPartState = vi.fn();
    try {
      DDBMuncher.prototype._preSyncPartState.call(app, "details", next, prior, {});
      expect(next.innerHTML).toBe(prior.innerHTML);
      expect(next.classList.contains("munching-details-hidden")).toBe(false);
      expect(next.querySelector<HTMLButtonElement>("#munch-details-okay")!.disabled).toBe(false);
    } finally {
      if (original) base._preSyncPartState = original;
      else delete base._preSyncPartState;
    }
  });

});
