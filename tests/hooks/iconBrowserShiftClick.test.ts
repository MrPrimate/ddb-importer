// @vitest-environment jsdom
import { resetMockSettings, setMockSettings } from "../_setup/foundryMocks";

// DDBIconPicker extends DDBAppV2, which does not load under the test environment. The hook only
// constructs it with the selection callback and renders it, so record both.
const opened: ((path: string) => void)[] = [];
const searches: (string | undefined)[] = [];
vi.mock("../../src/apps/DDBIconPicker", () => ({
  default: class {
    constructor(select: (path: string) => void, options?: { search?: string }) {
      opened.push(select);
      searches.push(options?.search);
    }

    render() {
      return Promise.resolve(this);
    }
  },
}));

const { findIconTarget, isIconBrowserSheet, iconBrowserSelection, iconSearchTerm, registerIconBrowserShiftClick } = await import(
  "../../src/hooks/ready/iconBrowserShiftClick"
);

const instances = foundry.applications.instances as unknown as Map<string, unknown>;

/** An open sheet window holding the given markup, registered like a rendered ApplicationV2. */
function mountSheet(id: string, html: string, app: Record<string, unknown>) {
  const element = document.createElement("div");
  element.id = id;
  element.className = "application";
  element.innerHTML = `<form>${html}</form>`;
  document.body.append(element);
  const form = element.querySelector("form")!;
  instances.set(id, { element, form, ...app });
  return element;
}

function itemDocument(name = "Flame Tongue Longsword") {
  return { documentName: "Item", name, update: vi.fn(async () => undefined) };
}

function shiftClick(target: Element, shiftKey = true) {
  target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, shiftKey }));
}

beforeAll(() => {
  registerIconBrowserShiftClick();
});

beforeEach(() => {
  opened.length = 0;
  searches.length = 0;
  instances.clear();
  document.body.innerHTML = "";
  resetMockSettings();
  setMockSettings({ "icon-browser-shift-click": true });
});

describe("findIconTarget", () => {
  it("resolves an unlocked header image", () => {
    const sheet = mountSheet("a", "<img data-action=\"editImage\" data-edit=\"img\" src=\"x.webp\">", {});
    const image = sheet.querySelector("img")!;
    expect(findIconTarget(image)).toBe(image);
  });

  it("ignores a locked header image", () => {
    const sheet = mountSheet("a", "<img data-action=\"showIcon\" src=\"x.webp\">", {});
    expect(findIconTarget(sheet.querySelector("img"))).toBeNull();
  });

  it("resolves an image file picker from its inner button and input", () => {
    const sheet = mountSheet("a", "<file-picker type=\"image\" name=\"img\"><input type=\"text\"><button></button></file-picker>", {});
    const picker = sheet.querySelector("file-picker");
    expect(findIconTarget(sheet.querySelector("button"))).toBe(picker);
    expect(findIconTarget(sheet.querySelector("input"))).toBe(picker);
  });

  it("ignores disabled and non-image file pickers", () => {
    const sheet = mountSheet(
      "a",
      "<file-picker type=\"image\" name=\"img\" disabled><button></button></file-picker>"
        + "<file-picker type=\"audio\" name=\"sound\"><button></button></file-picker>",
      {},
    );
    for (const button of sheet.querySelectorAll("button")) expect(findIconTarget(button)).toBeNull();
  });
});

describe("isIconBrowserSheet", () => {
  it("accepts item, effect and item-owned pseudo-document sheets", () => {
    expect(isIconBrowserSheet({ document: { documentName: "Item" } })).toBe(true);
    expect(isIconBrowserSheet({ document: { documentName: "ActiveEffect" } })).toBe(true);
    expect(isIconBrowserSheet({ document: {}, item: { documentName: "Item" } })).toBe(true);
  });

  it("rejects actor, token, document-less and read-only sheets", () => {
    expect(isIconBrowserSheet({ document: { documentName: "Actor" } })).toBe(false);
    expect(isIconBrowserSheet({ document: { documentName: "Token" } })).toBe(false);
    expect(isIconBrowserSheet({})).toBe(false);
    expect(isIconBrowserSheet({ document: { documentName: "Item" }, isEditable: false })).toBe(false);
  });
});

describe("iconBrowserSelection", () => {
  it("does nothing without shift", () => {
    const sheet = mountSheet("a", "<img data-action=\"editImage\" data-edit=\"img\">", { document: itemDocument() });
    const event = new MouseEvent("click", { shiftKey: false });
    Object.defineProperty(event, "target", { value: sheet.querySelector("img") });
    expect(iconBrowserSelection(event)).toBeNull();
  });
});

describe("iconSearchTerm", () => {
  it("drops filler words from the document name", () => {
    expect(iconSearchTerm({ document: { name: "Cloak of the Bat" } })).toBe("cloak bat");
    expect(iconSearchTerm({ document: { name: "Second Wind" } })).toBe("wind");
  });

  it("falls back to the item name when the activity name is unset or only filler", () => {
    const item = { documentName: "Item", name: "Cure Wounds" };
    // dnd5e prepares an unnamed activity's name from its type
    expect(iconSearchTerm({ document: { name: "Heal", _source: { name: "" } }, item })).toBe("cure wounds");
    expect(iconSearchTerm({ document: { name: "Use", _source: { name: "Use" } }, item })).toBe("cure wounds");
    expect(iconSearchTerm({ document: { name: "Breath", _source: { name: "Breath" } }, item })).toBe("breath");
  });

  it("is empty when nothing survives", () => {
    expect(iconSearchTerm({ document: { name: "The Item" } })).toBe("");
  });
});

describe("registerIconBrowserShiftClick", () => {
  it("opens the browser on shift-click and submits the chosen image", () => {
    const sheet = mountSheet("item", "<img data-action=\"editImage\" data-edit=\"img\" src=\"old.webp\">", {
      document: itemDocument(),
      options: { form: { submitOnChange: true } },
    });
    const submitted = vi.fn((event: Event) => event.preventDefault());
    sheet.querySelector("form")!.addEventListener("submit", submitted);
    const image = sheet.querySelector("img")!;
    shiftClick(image);
    expect(opened).toHaveLength(1);
    expect(searches).toEqual(["flame tongue longsword"]);
    opened[0]("icons/new.webp");
    expect(image.getAttribute("src")).toBe("icons/new.webp");
    expect(submitted).toHaveBeenCalledOnce();
  });

  it("updates the document when the sheet does not submit on change", () => {
    const document = itemDocument();
    const sheet = mountSheet("effect", "<img data-action=\"editImage\" data-edit=\"img\">", { document });
    shiftClick(sheet.querySelector("img")!);
    opened[0]("icons/new.webp");
    expect(document.update).toHaveBeenCalledWith({ img: "icons/new.webp" });
  });

  it("fills an activity file picker, finding it again after a rerender", () => {
    const sheet = mountSheet(
      "activity",
      "<file-picker type=\"image\" name=\"img\"><button></button></file-picker>",
      { document: {}, item: { documentName: "Item" } },
    );
    shiftClick(sheet.querySelector("button")!);
    sheet.querySelector("form")!.innerHTML = "<file-picker type=\"image\" name=\"img\"></file-picker>";
    const replacement = sheet.querySelector("file-picker") as HTMLElement & { value?: string };
    const changed = vi.fn();
    replacement.addEventListener("change", changed);
    opened[0]("icons/new.webp");
    expect(replacement.value).toBe("icons/new.webp");
    expect(changed).toHaveBeenCalledOnce();
  });

  it("leaves actor portraits and plain clicks alone", () => {
    const actor = mountSheet("actor", "<img data-action=\"editImage\" data-edit=\"img\">", {
      document: { documentName: "Actor" },
    });
    shiftClick(actor.querySelector("img")!);
    const item = mountSheet("item", "<img data-action=\"editImage\" data-edit=\"img\">", { document: itemDocument() });
    shiftClick(item.querySelector("img")!, false);
    expect(opened).toHaveLength(0);
  });

  it("binds no listener when the setting is off", async () => {
    // a fresh module copy, since the one loaded above is already bound
    vi.resetModules();
    const fresh = await import("../../src/hooks/ready/iconBrowserShiftClick");
    setMockSettings({ "icon-browser-shift-click": false });
    const add = vi.spyOn(document.body, "addEventListener");
    try {
      fresh.registerIconBrowserShiftClick();
      expect(add).not.toHaveBeenCalled();
    } finally {
      add.mockRestore();
    }
  });
});
