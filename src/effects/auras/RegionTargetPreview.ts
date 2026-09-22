/** Local chooser outlines: independent of native hover, control and the user's actual targets. */
export default class RegionTargetPreview {
  #form: HTMLFormElement;
  #tokens: Map<string, TokenDocument.Implementation>;
  #selected = new Set<string>();
  #hovered: string | null = null;
  #focused: string | null = null;
  #outlines = new Map<string, PIXI.Graphics>();
  #listeners = new AbortController();
  #hooks: [Hooks.HookName, number][];

  constructor(form: HTMLFormElement, tokens: TokenDocument.Implementation[]) {
    this.#form = form;
    this.#tokens = new Map(tokens.map((token) => [token.uuid!, token]));
    const options = { signal: this.#listeners.signal };
    for (const row of form.querySelectorAll<HTMLElement>(".ddb-region-recipient")) {
      const uuid = row.querySelector<HTMLInputElement>("input")!.value;
      row.addEventListener("pointerenter", () => {
        this.#hovered = uuid;
        this.#refresh();
      },
      options);
      row.addEventListener("pointerleave", () => {
        this.#hovered = null;
        this.#refresh();
      },
      options);
      row.addEventListener("focusin", () => {
        this.#focused = uuid;
        this.#refresh();
      },
      options);
      row.addEventListener("focusout", () => {
        this.#focused = null;
        this.#refresh();
      },
      options);
    }
    form.addEventListener("change", () => this.#refresh(), options);

    // These listeners exist only while choosing. Token refresh follows movement, size and
    // visibility changes; scene teardown releases graphics before Foundry destroys their parents.
    this.#hooks = [
      [
        "refreshToken",
        Hooks.on<"refreshToken">("refreshToken", (token: Token) => {
          if (this.#tokens.has(token.document.uuid!)) this.#draw(token);
        }),
      ],
      ["canvasTearDown", Hooks.on<"canvasTearDown">("canvasTearDown", () => this.#clear())],
      ["canvasReady", Hooks.on<"canvasReady">("canvasReady", () => this.#refresh())],
    ];
    this.#refresh();
  }

  #refresh(): void {
    this.#selected = new Set(
      [...this.#form.querySelectorAll<HTMLInputElement>(`input[name="recipient"]:checked`)].map((input) => input.value),
    );
    for (const token of this.#tokens.values()) {
      if (token.object) this.#draw(token.object);
    }
  }

  /** A child outline inherits the token's position and visibility without invoking hover hooks. */
  #draw(token: Token): void {
    const uuid = token.document.uuid!;
    const previewed = this.#hovered === uuid || this.#focused === uuid;
    const eligible =
      canvas?.ready &&
      token.document.parent === canvas.scene &&
      !token.destroyed &&
      token.visible &&
      token.renderable &&
      (game.user.isGM || (!token.document.hidden && !token.document.isSecret));
    if (!eligible || (!previewed && !this.#selected.has(uuid))) {
      this.#remove(uuid);
      return;
    }
    let outline = this.#outlines.get(uuid);
    if (!outline || outline.destroyed) {
      outline = token.addChild(new PIXI.Graphics());
      outline.eventMode = "none";
      outline.zIndex = Infinity;
      this.#outlines.set(uuid, outline);
    }
    // Inset the border so adjacent occupied squares remain distinguishable. Hover/focus is
    // gold; checked recipients stay green after the pointer or keyboard focus moves away.
    const width = Math.max(1, token.w - 6);
    const height = Math.max(1, token.h - 6);
    outline
      .clear()
      .lineStyle(6, 0x000000, 0.8)
      .drawRoundedRect(3, 3, width, height, 8)
      .lineStyle(3, previewed ? 0xffd166 : 0x66dd99, 1)
      .drawRoundedRect(3, 3, width, height, 8);
  }

  #remove(uuid: string): void {
    const outline = this.#outlines.get(uuid);
    if (outline && !outline.destroyed) outline.destroy();
    this.#outlines.delete(uuid);
  }

  #clear(): void {
    for (const uuid of this.#outlines.keys()) this.#remove(uuid);
  }

  /** Called on close, cancellation and re-render; each dialog owns only its own graphics. */
  destroy(): void {
    this.#listeners.abort();
    for (const [hook, id] of this.#hooks) {
      Hooks.off<typeof hook>(hook, id);
    }
    this.#hooks = [];
    this.#clear();
  }
}
