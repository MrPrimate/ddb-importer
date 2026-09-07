// @vitest-environment jsdom
// The muncher loading dialog is driven by direct DOM writes and a cooperative
// cancel flag. These pin the bar/status wiring through notifierV2 and that
// cancel, whether via the button or the window close, is what checkCancelled
// reports.

// the lib barrel imports app dialogs that extend DDBAppV2, so pulling it in for
// real here would be a circular import; only logger is needed
vi.mock("../../src/lib/_module", () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import DDBAppV2 from "../../src/apps/DDBAppV2";
import DDBMuncherLoader, { DDBMuncherLoadCancelled } from "../../src/apps/DDBMuncherLoader";
import { DICTIONARY } from "../../src/config/_module";

// mirrors handlebars/muncher/loader.hbs
const LOADER_MARKUP = `
  <div class="ddb-muncher-loader">
    <p class="munching-task-notes" id="munching-task-notes"></p>
    <div class="munching-progress munching-progress-primary">
      <div class="munching-progress-bar" style="width: 0%"></div>
    </div>
    <p class="munching-task-monster ddb-muncher-loader-quip" id="munching-task-monster"></p>
    <footer class="form-footer">
      <button type="button" data-action="cancel">Cancel</button>
    </footer>
  </div>
`;

// the private controller and step counter live on real instances, so build one
// (ApplicationV2 is a no-op stub under test) and give it rendered markup
function buildLoader(total = 4) {
  const loader = new DDBMuncherLoader({ total });
  const element = document.createElement("div");
  element.innerHTML = LOADER_MARKUP;
  Object.defineProperty(loader, "element", { value: element, configurable: true });
  Object.defineProperty(loader, "close", { value: vi.fn(async () => undefined), configurable: true });
  return loader as DDBMuncherLoader & { close: ReturnType<typeof vi.fn> };
}

function barWidth(loader: DDBMuncherLoader): string {
  return (loader.element.querySelector(".munching-progress-bar") as HTMLElement).style.width;
}

function status(loader: DDBMuncherLoader): string {
  return (loader.element.querySelector("#munching-task-notes") as HTMLElement).textContent ?? "";
}

describe("DDBMuncherLoader", () => {

  it("advances the bar one step at a time and shows the step text", () => {
    const loader = buildLoader(4);

    loader.step("Checking your cookie");
    expect(barWidth(loader)).toBe("25%");
    expect(status(loader)).toBe("1/4 : Checking your cookie");

    loader.step("Loading lists");
    expect(barWidth(loader)).toBe("50%");
    expect(loader.current).toBe(2);
  });

  it("never reports past the declared total", () => {
    const loader = buildLoader(2);
    loader.step("a");
    loader.step("b");
    loader.step("c");
    expect(loader.current).toBe(2);
    expect(barWidth(loader)).toBe("100%");
  });

  it("is silent until cancelled, then throws the cancel error", async () => {
    const loader = buildLoader();
    expect(() => loader.checkCancelled()).not.toThrow();
    expect(loader.cancelled).toBe(false);

    await DDBMuncherLoader.cancel.call(loader);

    expect(loader.cancelled).toBe(true);
    expect(loader.signal.aborted).toBe(true);
    expect(loader.close).toHaveBeenCalledTimes(1);
    expect(() => loader.checkCancelled()).toThrow(DDBMuncherLoadCancelled);
  });

  it("treats closing the window as a cancel", () => {
    const loader = buildLoader();
    // the ApplicationV2 stub has no _onClose for DDBAppV2's super call to reach
    const base = Object.getPrototypeOf(DDBAppV2.prototype);
    base._onClose ??= () => undefined;
    loader._onClose({} as any);
    expect(loader.cancelled).toBe(true);
  });

  it("writes a quip from the muncher list to the quip row", () => {
    const loader = buildLoader();
    loader.showQuip();
    const quip = (loader.element.querySelector("#munching-task-monster") as HTMLElement).textContent ?? "";
    expect(DICTIONARY.messages.loading.muncher).toContain(quip);
  });

  it("does not use the generic ApplicationV2 context path", async () => {
    const loader = buildLoader();
    const context = await loader._prepareContext({});
    expect(context).toHaveProperty("message");
    expect(DICTIONARY.messages.loading.muncher).toContain((context as any).quip);
  });

});
