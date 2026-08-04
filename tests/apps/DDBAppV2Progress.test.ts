// @vitest-environment jsdom
// Pins how notifierV2 routes to the import details pane: which bar a
// progressBar value drives, and which row a section writes to. The overall bar
// was added for whole-run munch progress and must not disturb the per-batch
// primary/secondary bars.

// the lib barrel imports app dialogs that extend DDBAppV2, so pulling it in for
// real here would be a circular import; only logger is needed
vi.mock("../../src/lib/_module", () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import DDBAppV2 from "../../src/apps/DDBAppV2";

// mirrors handlebars/muncher/details.hbs
const DETAILS_MARKUP = `
  <div class="ddb-muncher-details">
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
  </div>
`;

// DDBAppV2 is abstract and its element comes from ApplicationV2, so exercise the
// methods against a plain object holding the rendered markup
function buildApp() {
  const element = document.createElement("div");
  element.innerHTML = DETAILS_MARKUP;
  return {
    element,
    notifierV2: DDBAppV2.prototype.notifierV2,
    getMessageClass: DDBAppV2.prototype.getMessageClass,
    clearProgressBars: DDBAppV2.prototype.clearProgressBars,
  } as unknown as DDBAppV2;
}

function barWidth(app: DDBAppV2, name: string): string {
  const bar = app.element.querySelector(`.munching-progress-${name} .munching-progress-bar`) as HTMLElement;
  return bar.style.width;
}

function barHidden(app: DDBAppV2, name: string): boolean {
  const wrapper = app.element.querySelector(`.munching-progress-${name}`) as HTMLElement;
  return wrapper.classList.contains("munching-hidden");
}

describe("DDBAppV2 progress bars", () => {

  it("drives the overall bar without touching the batch bars", () => {
    const app = buildApp();

    app.notifierV2({
      progress: { current: 487, total: 1043 },
      section: "overall",
      message: "parsing monsters",
      progressBar: "overall",
      suppress: true,
    });

    expect(barWidth(app, "overall")).toBe("46%");
    expect(barHidden(app, "overall")).toBe(false);
    expect(barWidth(app, "primary")).toBe("0%");
    expect(barWidth(app, "secondary")).toBe("0%");
    expect(barHidden(app, "primary")).toBe(true);
    expect((app.element.querySelector("#munching-task-overall") as HTMLElement).textContent)
      .toBe("487/1043 : parsing monsters");
  });

  it("keeps primary and secondary on their own bars", () => {
    const app = buildApp();

    app.notifierV2({ progress: { current: 1, total: 4 }, message: "a", progressBar: "primary", suppress: true });
    app.notifierV2({ progress: { current: 3, total: 4 }, message: "b", progressBar: "secondary", suppress: true });

    expect(barWidth(app, "primary")).toBe("25%");
    expect(barWidth(app, "secondary")).toBe("75%");
    expect(barWidth(app, "overall")).toBe("0%");
  });

  it("defaults to the primary bar for an unknown bar name", () => {
    const app = buildApp();

    app.notifierV2({
      progress: { current: 1, total: 2 },
      message: "a",
      progressBar: "nonsense" as any,
      suppress: true,
    });

    expect(barWidth(app, "primary")).toBe("50%");
  });

  it("writes note messages to the notes row", () => {
    const app = buildApp();

    app.notifierV2({ section: "note", message: "checking files", suppress: true });

    expect((app.element.querySelector("#munching-task-notes") as HTMLElement).textContent).toBe("checking files");
  });

  it("hides a bar again when clearing", () => {
    const app = buildApp();

    app.notifierV2({
      progress: { current: 4, total: 4 },
      message: "",
      progressBar: "secondary",
      clear: true,
      suppress: true,
    });

    expect(barWidth(app, "secondary")).toBe("100%");
    expect(barHidden(app, "secondary")).toBe(true);
  });

  it("resets every bar and the overall caption", () => {
    const app = buildApp();
    app.notifierV2({ progress: { current: 1, total: 2 }, message: "a", progressBar: "primary", suppress: true });
    app.notifierV2({
      progress: { current: 2, total: 2 }, section: "overall", message: "done", progressBar: "overall", suppress: true,
    });

    app.clearProgressBars();

    for (const name of ["primary", "secondary", "overall"]) {
      expect(barWidth(app, name)).toBe("0%");
      expect(barHidden(app, name)).toBe(true);
    }
    expect((app.element.querySelector("#munching-task-overall") as HTMLElement).textContent).toBe("");
  });

});
