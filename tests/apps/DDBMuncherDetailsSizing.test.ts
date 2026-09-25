// @vitest-environment jsdom
// The import details overlay is position: absolute; inset: 0 over the muncher's
// window-content, so on the short tabs (feats, backgrounds, species) it is taller
// than the auto-height window and gets clipped. These pin the height reservation:
// grow on munch start, restore the pre-munch height when the overlay is dismissed.

import DDBMuncher from "../../src/apps/DDBMuncher";

// mirrors the parts of handlebars/muncher/details.hbs _disableButtons touches
const MARKUP = `
  <div class="window-content">
    <button id="munch-feats-start"></button>
    <div class="ddb-muncher-details munching-details-hidden">
      <div class="munching-task-name" id="munching-task-name"></div>
      <div class="munching-task-monster" id="munching-task-monster"></div>
      <div class="munching-task-notes" id="munching-task-notes"></div>
      <div class="munching-progress munching-progress-primary munching-hidden">
        <div class="munching-progress-bar" style="width: 0%"></div>
      </div>
      <div class="munching-task-import" id="munching-task-import"></div>
      <div class="munching-progress munching-progress-secondary munching-hidden">
        <div class="munching-progress-bar" style="width: 0%"></div>
      </div>
      <div class="munching-task-overall" id="munching-task-overall"></div>
      <div class="munching-progress munching-progress-overall munching-hidden">
        <div class="munching-progress-bar" style="width: 0%"></div>
      </div>
      <button id="munch-details-okay" class="munching-hidden"></button>
      <div class="ddb-overlay munching-invalid"></div>
    </div>
  </div>
`;

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

});
