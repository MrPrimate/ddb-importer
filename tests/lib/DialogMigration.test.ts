import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DialogHelper from "../../src/lib/DialogHelper";
import { ChooserDialog, optionsToPosition } from "../../src/lib/AdvancedDialog";

const DialogV2 = () => (globalThis as any).foundry.applications.api.DialogV2;

/**
 * Build a fake DialogV2 button whose `.form` answers `querySelector('#ddb-<idx>')`
 * from the supplied element map, mirroring the DOM the real dialog would present.
 */
function fakeButton(elements: Record<string, any>): any {
  return {
    form: {
      querySelector: (selector: string) => elements[selector] ?? null,
    },
  };
}

// Spy on DialogV2.wait, capturing the config it is called with. Returns a getter
// for the last captured config plus control over the resolved value.
function spyWait(resolveValue: any = "WAIT_RESULT") {
  return vi.spyOn(DialogV2(), "wait").mockImplementation(async (config: any) => {
    (spyWait as any)._last = config;
    return resolveValue;
  });
}
function lastConfig(): any {
  return (spyWait as any)._last;
}

describe("optionsToPosition", () => {
  it("passes through numeric width and height", () => {
    expect(optionsToPosition({ width: 450, height: 200 })).toEqual({ width: 450, height: 200 });
  });

  it("drops non-numeric values like the legacy height:auto", () => {
    expect(optionsToPosition({ height: "auto", width: 300 })).toEqual({ width: 300 });
  });

  it("returns an empty object for no options", () => {
    expect(optionsToPosition()).toEqual({});
    expect(optionsToPosition({})).toEqual({});
  });
});

describe("DialogHelper.buttonDialog", () => {
  let spy: ReturnType<typeof spyWait>;

  beforeEach(() => {
    spy = spyWait("chosen");
  });
  afterEach(() => {
    spy.mockRestore();
  });

  it("returns null and never opens a dialog when there are no buttons", async () => {
    const result = await DialogHelper.buttonDialog({ title: "t", buttons: [] });
    expect(result).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("maps buttons to DialogV2 actions whose callbacks resolve the button value", async () => {
    await DialogHelper.buttonDialog({
      title: "Pick one",
      content: "<b>hi</b>",
      buttons: [
        { label: "Label1", value: "Value1" },
        { label: "Label2", value: { obj: true } },
      ],
    });

    const config = lastConfig();
    expect(config.window).toEqual({ title: "Pick one" });
    expect(config.content).toBe("<b>hi</b>");
    expect(config.rejectClose).toBe(false);
    expect(config.buttons).toHaveLength(2);
    expect(config.buttons[0].action).toBe("button-0");
    expect(config.buttons[0].label).toBe("Label1");
    expect(config.buttons[0].callback()).toBe("Value1");
    // object values survive (used by e.g. dancingLights)
    expect(config.buttons[1].callback()).toEqual({ obj: true });
  });

  it("uses row direction and options->position by default", async () => {
    await DialogHelper.buttonDialog({ buttons: [{ label: "A", value: "a" }], options: { width: 450 } });
    const config = lastConfig();
    expect(config.classes).toEqual(["ddb-button-dialog", "ddb-button-dialog-row"]);
    expect(config.position).toEqual({ width: 450 });
  });

  it("honours the direction argument in the css class", async () => {
    await DialogHelper.buttonDialog({ buttons: [{ label: "A", value: "a" }] }, "column");
    expect(lastConfig().classes).toEqual(["ddb-button-dialog", "ddb-button-dialog-column"]);
  });

  it("resolves null on close (socket-safe, replacing the legacy `this`)", async () => {
    await DialogHelper.buttonDialog({ buttons: [{ label: "A", value: "a" }] });
    expect(lastConfig().close()).toBeNull();
  });
});

describe("ChooserDialog.ask", () => {
  let spy: ReturnType<typeof spyWait>;

  beforeEach(() => {
    spy = spyWait("WAIT_RESULT");
  });
  afterEach(() => {
    spy.mockRestore();
  });

  const inputs = [
    { label: "A Label", type: "label" },
    {
      label: "Select",
      type: "select",
      options: [
        { label: "a", value: "AA" },
        { label: "b", value: "BB" },
      ],
    },
    { label: "Check", type: "checkbox" },
    { label: "Num", type: "number" },
    { label: "Text", type: "text" },
  ];

  // Element map aligned to `inputs` indices for _parseSelectionResults.
  const formElements = {
    "#ddb-1": { value: "1" }, // select -> options[1].value === "BB"
    "#ddb-2": { checked: true }, // checkbox
    "#ddb-3": { valueAsNumber: 7 }, // number
    "#ddb-4": { value: "hello" }, // text
  };
  const expectedResults = [null, "BB", true, 7, "hello"];

  it("returns the DialogV2.wait result", async () => {
    const dialog = new ChooserDialog(inputs, [{ label: "Yes", value: "yes" }]);
    const result = await dialog.ask();
    expect(result).toBe("WAIT_RESULT");
  });

  it("maps buttons, marks the default, and builds the result payload", async () => {
    const dialog = new ChooserDialog(inputs, [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no", default: true },
    ]);
    await dialog.ask();
    const config = lastConfig();

    expect(config.window).toEqual({ title: "" });
    expect(config.classes).toEqual(["dialog", "ddb-advanced-dialog"]);
    expect(config.buttons.map((b: any) => b.action)).toEqual(["button-0", "button-1"]);
    expect(config.buttons.map((b: any) => b.default)).toEqual([false, true]);

    const payload = config.buttons[0].callback(new Event("click"), fakeButton(formElements));
    expect(payload).toEqual({
      button: { label: "Yes", value: "yes" },
      results: expectedResults,
      inputs,
      success: true,
    });
  });

  it("falls back to the config defaultButton label for the default flag", async () => {
    const dialog = new ChooserDialog(inputs, [
      { label: "Random", value: "random" },
      { label: "Cancel", value: "cancel" },
    ], { defaultButton: "Random" });
    await dialog.ask();
    expect(lastConfig().buttons.map((b: any) => b.default)).toEqual([true, false]);
  });

  it("routes through a per-button callback, using its return value", async () => {
    const callback = vi.fn((results: any) => ({ ...results, extra: 1 }));
    const dialog = new ChooserDialog(inputs, [{ label: "Go", value: "go", callback }]);
    await dialog.ask();

    const returned = lastConfig().buttons[0].callback(new Event("click"), fakeButton(formElements));
    expect(callback).toHaveBeenCalledOnce();
    expect(returned).toEqual({
      button: { label: "Go", value: "go", callback },
      results: expectedResults,
      inputs,
      success: true,
      extra: 1,
    });
  });

  it("inserts a single default OK button when none are supplied", async () => {
    const dialog = new ChooserDialog(inputs, []);
    await dialog.ask();
    const config = lastConfig();
    expect(config.buttons).toHaveLength(1);
    expect(config.buttons[0]).toMatchObject({ action: "defaultButton", label: "OK", default: true });

    const payload = config.buttons[0].callback(new Event("click"), fakeButton(formElements));
    expect(payload).toEqual({
      button: { value: "default", label: "OK" },
      results: expectedResults,
      inputs,
      success: true,
    });
  });

  it("resolves {success:false} on close by default", async () => {
    const dialog = new ChooserDialog(inputs, [{ label: "Yes", value: "yes" }]);
    await dialog.ask();
    expect(lastConfig().close()).toEqual({ success: false });
  });

  it("maps config.options to a position and honours a custom close", async () => {
    const close = vi.fn(() => ({ success: false, custom: true }));
    const dialog = new ChooserDialog(inputs, [{ label: "Yes", value: "yes" }], {
      options: { width: 600, height: 400 },
      close,
    });
    await dialog.ask();
    const config = lastConfig();
    expect(config.position).toEqual({ width: 600, height: 400 });
    expect(config.close()).toEqual({ success: false, custom: true });
  });
});
