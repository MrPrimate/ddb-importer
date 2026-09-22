// @vitest-environment jsdom
import RegionTargetPrompt from "../../../src/effects/auras/RegionTargetPrompt";

interface ITestDialogConfig {
  content: string;
  render: (event: Event, app: { element: HTMLElement; close: () => Promise<void> }) => void;
  close: () => unknown;
  buttons: { action: string; callback?: (event: Event, button: HTMLButtonElement) => unknown }[];
}

class Outline {
  destroyed = false;
  eventMode = "auto";
  zIndex = 0;
  parent?: { children: Outline[] };
  clear = vi.fn(() => this);
  lineStyle = vi.fn(() => this);
  drawRoundedRect = vi.fn(() => this);
  destroy() {
    this.destroyed = true;
    if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
  }
}

const scene = { id: "scene" };
function makeToken(id: string) {
  const doc = {
    uuid: `Scene.scene.Token.${id}`,
    name: `Token ${id}`,
    parent: scene,
    actor: { img: "actor.webp" },
    texture: { src: `${id}.webp` },
    hidden: false,
    isSecret: false,
    get object() {
      return token;
    },
  };
  const token = {
    document: doc,
    visible: true,
    renderable: true,
    isVisible: true,
    destroyed: false,
    w: 100,
    h: 100,
    controlled: false,
    hover: false,
    children: [] as Outline[],
    addChild(outline: Outline) {
      this.children.push(outline);
      outline.parent = this;
      return outline;
    },
  };
  return doc;
}
type TToken = ReturnType<typeof makeToken>;
let tokens: TToken[];
let hooks: Map<string, Map<number, (...args: unknown[]) => void>>;
let dialogs: ReturnType<typeof makeDialog>[];
const request = (): IRegionTargetRequest => ({
  id: "request",
  actorUuid: "Actor.source",
  regionUuid: "Scene.scene.Region.aura",
  title: "Aura",
  instruction: "Choose visible creatures",
  tokenUuids: tokens.map((token) => token.uuid),
  max: 2,
  activities: [
    { id: "two", name: "Two", max: 2 },
    { id: "one", name: "One", max: 1 },
  ],
});

function makeDialog(config: ITestDialogConfig, resolve: (value: unknown) => void) {
  const element = document.createElement("dialog");
  element.open = true;
  element.innerHTML = `<form>${config.content}<button data-action="choose" type="button">Choose</button></form>`;
  document.body.append(element);
  const app = {
    element,
    close: async () => {
      config.close();
      element.remove();
      resolve(null);
    },
  };
  const render = () => config.render(new Event("render"), app);
  render();
  return {
    app,
    render,
    form: element.querySelector("form")!,
    rows: [...element.querySelectorAll<HTMLElement>(".ddb-region-recipient")],
    boxes: [...element.querySelectorAll<HTMLInputElement>("input[name=\"recipient\"]")],
    choose: () => {
      const result = config.buttons
        .find((button) => button.action === "choose")
        ?.callback?.(new Event("click"), element.querySelector("button")!);
      config.close();
      element.remove();
      resolve(result);
    },
    skip: () => {
      config.close();
      element.remove();
      resolve("skip");
    },
  };
}

function open(waiting = false) {
  const controller = new AbortController();
  const promise = RegionTargetPrompt.show(request(), controller.signal, waiting);
  return { ...dialogs.at(-1)!, controller, promise };
}
function change(input: HTMLInputElement, checked: boolean) {
  input.checked = checked;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
function fire(hook: string, ...args: unknown[]) {
  for (const fn of hooks.get(hook)?.values() ?? []) fn(...args);
}
function hookCount() {
  return [...hooks.values()].reduce((count, listeners) => count + listeners.size, 0);
}

beforeEach(() => {
  tokens = [makeToken("a"), makeToken("b"), makeToken("c")];
  hooks = new Map();
  dialogs = [];
  let hookId = 0;
  vi.stubGlobal("Hooks", {
    on: (event: string, fn: (...args: unknown[]) => void) => {
      if (!hooks.has(event)) hooks.set(event, new Map());
      hooks.get(event)!.set(++hookId, fn);
      return hookId;
    },
    off: (event: string, id: number) => hooks.get(event)?.delete(id),
  });
  vi.stubGlobal("canvas", { ready: true, scene });
  vi.stubGlobal("PIXI", { Graphics: Outline });
  vi.stubGlobal("game", { ...game, user: { isGM: false, targets: new Set(["existing-target"]) } });
  vi.stubGlobal("fromUuidSync", (uuid: string) => tokens.find((token) => token.uuid === uuid));
  vi.stubGlobal("foundry", {
    ...foundry,
    utils: {
      ...foundry.utils,
      escapeHTML: (value: string) => {
        const span = document.createElement("span");
        span.textContent = value;
        return span.innerHTML.replaceAll("\"", "&quot;");
      },
    },
    helpers: { media: { VideoHelper: { hasVideoExtension: (src: string) => (/\.(webm|mp4)$/i).test(src) } } },
  });
  vi.spyOn(foundry.applications.api.DialogV2, "wait").mockImplementation(
    (config) =>
      new Promise((resolve) => {
        dialogs.push(makeDialog(config as unknown as ITestDialogConfig, resolve));
      }),
  );
});

afterEach(async () => {
  for (const dialog of dialogs) await dialog.app.close();
  expect(hookCount()).toBe(0);
  for (const token of tokens) expect(token.object.children).toHaveLength(0);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

it("renders escaped token portraits/names, still portraits for video, and a failed-image fallback", async () => {
  tokens[0].name = "<img src=x onerror=\"bad()\">";
  tokens[0].texture.src = "portrait.webp?name=\" onerror=\"bad()";
  tokens[1].texture.src = "animated.webm";
  tokens[2].texture.src = "";
  tokens[2].actor.img = "";
  const dialog = open();
  const images = dialog.form.querySelectorAll("img");
  expect(images).toHaveLength(3);
  expect(images[0].getAttribute("src")).toBe(tokens[0].texture.src);
  expect(images[0].hasAttribute("onerror")).toBe(false);
  expect(dialog.rows[0].textContent).toBe(tokens[0].name);
  expect(images[1].getAttribute("src")).toBe("actor.webp");
  expect(images[2].getAttribute("src")).toBe("icons/svg/mystery-man.svg");
  images[0].dispatchEvent(new Event("error"));
  expect(images[0].getAttribute("src")).toBe("icons/svg/mystery-man.svg");
  await dialog.app.close();
  await dialog.promise;
});

it("never renders hidden or unseen recipients on player clients", async () => {
  tokens[1].hidden = true;
  tokens[2].object.isVisible = false;
  const dialog = open();
  expect(dialog.boxes.map((box) => box.value)).toEqual([tokens[0].uuid]);
  expect(dialog.form.innerHTML).not.toContain("b.webp");
  expect(dialog.form.innerHTML).not.toContain("c.webp");
  await dialog.app.close();
});

it("combines checked, hovered and keyboard-focused previews without changing native targets or hover", async () => {
  const dialog = open();
  change(dialog.boxes[0], true);
  expect(tokens[0].object.children[0].lineStyle).toHaveBeenLastCalledWith(3, 0x66dd99, 1);
  dialog.rows[1].dispatchEvent(new Event("pointerenter"));
  expect(tokens[1].object.children[0].lineStyle).toHaveBeenLastCalledWith(3, 0xffd166, 1);
  dialog.boxes[2].focus();
  expect(tokens.every((token) => token.object.children.length === 1)).toBe(true);
  dialog.rows[1].dispatchEvent(new Event("pointerleave"));
  expect(tokens[1].object.children).toHaveLength(0);
  dialog.boxes[2].blur();
  expect(tokens[2].object.children).toHaveLength(0);
  expect(tokens[0].object.children).toHaveLength(1);
  expect([...game.user.targets]).toEqual(["existing-target"]);
  expect(tokens.every((token) => !token.object.hover && !token.object.controlled)).toBe(true);
  await dialog.app.close();
});

it("preserves limits, variant validation and the chosen UUIDs while previewing", async () => {
  const dialog = open();
  change(dialog.boxes[0], true);
  change(dialog.boxes[1], true);
  expect(dialog.boxes[2].disabled).toBe(true);
  const activity = dialog.form.querySelector("select")!;
  activity.value = "one";
  activity.dispatchEvent(new Event("change", { bubbles: true }));
  expect(dialog.form.querySelector("button")!.disabled).toBe(true);
  change(dialog.boxes[1], false);
  expect(dialog.form.querySelector("button")!.disabled).toBe(false);
  dialog.choose();
  expect(await dialog.promise).toEqual({ tokens: [tokens[0].uuid], activity: "one" });
  expect([...game.user.targets]).toEqual(["existing-target"]);
});

it.each(["close", "skip", "abort"])("releases graphics, DOM listeners and hooks on %s", async (action) => {
  const dialog = open();
  change(dialog.boxes[0], true);
  if (action === "abort") dialog.controller.abort();
  else if (action === "skip") dialog.skip();
  else await dialog.app.close();
  await dialog.promise;
  expect(hookCount()).toBe(0);
  dialog.rows[1].dispatchEvent(new Event("pointerenter"));
  change(dialog.boxes[2], true);
  expect(tokens.every((token) => !token.object.children.length)).toBe(true);
});

it("keeps concurrent dialogs' previews independent when one is cancelled", async () => {
  const first = open();
  const second = open();
  change(first.boxes[0], true);
  change(second.boxes[0], true);
  expect(tokens[0].object.children).toHaveLength(2);
  first.controller.abort();
  await first.promise;
  expect(tokens[0].object.children).toHaveLength(1);
  expect(hookCount()).toBe(3);
  await second.app.close();
  await second.promise;
});

it("respects changing visibility and token size and survives deletion of a rendered token", async () => {
  const dialog = open();
  change(dialog.boxes[0], true);
  const token = tokens[0].object;
  token.w = 200;
  fire("refreshToken", token);
  expect(token.children[0].drawRoundedRect).toHaveBeenLastCalledWith(3, 3, 194, 94, 8);
  token.visible = false;
  fire("refreshToken", token);
  expect(token.children).toHaveLength(0);
  token.visible = true;
  tokens[0].hidden = true;
  fire("refreshToken", token);
  expect(token.children).toHaveLength(0);
  tokens[0].hidden = false;
  fire("refreshToken", token);
  expect(token.children).toHaveLength(1);
  token.children[0].destroy();
  token.destroyed = true;
  fire("refreshToken", token);
  expect(token.children).toHaveLength(0);
  await dialog.app.close();
});

it("keeps distant GM choices selectable and clears/recreates outlines when viewing another scene", async () => {
  Object.assign(game.user, { isGM: true });
  const dialog = open();
  change(dialog.boxes[0], true);
  fire("canvasTearDown");
  Object.assign(canvas, { scene: { id: "other" } });
  fire("canvasReady");
  expect(tokens[0].object.children).toHaveLength(0);
  dialog.rows[1].dispatchEvent(new Event("pointerenter"));
  expect(tokens[1].object.children).toHaveLength(0);
  Object.assign(canvas, { scene });
  fire("canvasReady");
  expect(tokens[0].object.children).toHaveLength(1);
  expect(tokens[1].object.children).toHaveLength(1);
  dialog.choose();
  expect(await dialog.promise).toEqual({ tokens: [tokens[0].uuid], activity: "two" });
});

it("replaces preview listeners and graphics on dialog re-render", async () => {
  const dialog = open();
  change(dialog.boxes[0], true);
  const old = tokens[0].object.children[0];
  dialog.render();
  expect(old.destroyed).toBe(true);
  expect(tokens[0].object.children).toHaveLength(1);
  expect(hookCount()).toBe(3);
  await dialog.app.close();
});

it("adds no canvas hooks or portraits to the GM waiting controls", async () => {
  const dialog = open(true);
  expect(dialog.rows).toHaveLength(0);
  expect(hookCount()).toBe(0);
  await dialog.app.close();
});

it("handles twenty candidates without scanning the scene or refreshing unrelated tokens", async () => {
  tokens = Array.from({ length: 20 }, (_, i) => makeToken(String(i)));
  const dialog = open();
  expect(dialog.rows).toHaveLength(20);
  change(dialog.boxes[0], true);
  change(dialog.boxes[1], true);
  expect(dialog.boxes.filter((box) => box.disabled)).toHaveLength(18);
  const outline = tokens[0].object.children[0];
  const count = outline.clear.mock.calls.length;
  const unrelated = makeToken("unrelated").object;
  for (let i = 0; i < 100; i++) fire("refreshToken", unrelated);
  expect(outline.clear).toHaveBeenCalledTimes(count);
  expect(unrelated.children).toHaveLength(0);
  await dialog.app.close();
});
