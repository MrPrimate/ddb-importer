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
      <button id="munch-details-okay" class="munching-hidden"></button>
      <div class="ddb-overlay munching-invalid"></div>
    </div>
  </div>
`;

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
    _disableButtons: DDBMuncher.prototype._disableButtons,
    _expandForDetails: DDBMuncher.prototype._expandForDetails,
    _restoreAfterDetails: DDBMuncher.prototype._restoreAfterDetails,
  };
  return app as unknown as DDBMuncher & { setPosition: ReturnType<typeof vi.fn> };
}

function isActive(app: DDBMuncher): boolean {
  return app.element.classList.contains("munching-active");
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

});
