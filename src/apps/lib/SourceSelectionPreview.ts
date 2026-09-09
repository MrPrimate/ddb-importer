/**
 * Floating preview of the source selection an import will actually run with, anchored to the
 * "Source Category Selection" buttons that sit beside each munch button.
 */
export default class SourceSelectionPreview {

  /** Grace period for the pointer to travel from the button into the panel without it closing. */
  static HIDE_DELAY_MS = 150;

  /** Gap between the anchor button and the panel, and the minimum gap to the viewport edge. */
  static MARGIN_PX = 8;

  private getSelection: () => IMuncherEffectiveSources;

  private panelElement: HTMLElement | null = null;

  private hideTimeout: number | null = null;

  // a button is held down on the panel, which is how a scrollbar drag looks
  private pointerHeld = false;

  private pointerInsidePanel = false;

  /**
   * Close, unless the event came from inside the panel.
   */
  private readonly boundHide = (event?: Event): void => {
    const target = event?.target;
    if (target instanceof Node && this.panelElement?.contains(target)) return;
    this.hide();
  };

  // a scrollbar drag routinely ends with the pointer outside the panel, so the release is watched
  // on the document rather than on the panel
  private readonly boundPointerUp = (): void => {
    this.pointerHeld = false;
    if (!this.pointerInsidePanel) this.scheduleHide();
  };

  constructor(getSelection: () => IMuncherEffectiveSources) {
    this.getSelection = getSelection;
  }

  get panel(): HTMLElement | null {
    return this.panelElement;
  }

  get visible(): boolean {
    return this.panelElement !== null;
  }

  /**
   * Wire a button up to the preview. Called for every button on every render, as each render
   * replaces the elements; the listeners die with the elements they were attached to.
   * @param {HTMLElement} button  A "Source Selection" button.
   */
  attach(button: HTMLElement): void {
    button.addEventListener("pointerenter", () => this.show(button));
    button.addEventListener("pointerleave", () => this.scheduleHide());
    // keyboard users get the same preview, since they cannot hover
    button.addEventListener("focus", () => this.show(button));
    button.addEventListener("blur", () => this.hide());
    // the click opens the source selection window, which the panel would otherwise sit over
    button.addEventListener("click", () => this.hide());
  }

  /**
   * Build and position the panel against a button. The content is rebuilt every time rather than
   * cached: the selection changes as the user edits categories and the book filter.
   * @param {HTMLElement} button  The button to anchor to.
   */
  show(button: HTMLElement): void {
    this.clearHide();
    const panel = this.ensurePanel();
    panel.replaceChildren(...this.buildContent());
    this.position(button);
    window.addEventListener("scroll", this.boundHide, true);
    window.addEventListener("resize", this.boundHide);
    document.addEventListener("pointerup", this.boundPointerUp);
  }

  hide(): void {
    this.clearHide();
    window.removeEventListener("scroll", this.boundHide, true);
    window.removeEventListener("resize", this.boundHide);
    document.removeEventListener("pointerup", this.boundPointerUp);
    this.pointerHeld = false;
    this.pointerInsidePanel = false;
    this.panelElement?.remove();
    this.panelElement = null;
  }

  /** Drop the panel for good: the muncher has closed or re-rendered its buttons away. */
  destroy(): void {
    this.hide();
  }

  private scheduleHide(): void {
    this.clearHide();
    this.hideTimeout = window.setTimeout(() => this.hide(), SourceSelectionPreview.HIDE_DELAY_MS);
  }

  private clearHide(): void {
    if (this.hideTimeout === null) return;
    window.clearTimeout(this.hideTimeout);
    this.hideTimeout = null;
  }

  private ensurePanel(): HTMLElement {
    if (this.panelElement) return this.panelElement;
    const panel = document.createElement("div");
    panel.className = "ddb-source-preview";
    panel.setAttribute("role", "tooltip");
    // the pointer moving onto the panel keeps it open, which is what makes it scrollable
    panel.addEventListener("pointerenter", () => {
      this.pointerInsidePanel = true;
      this.clearHide();
    });
    panel.addEventListener("pointerleave", () => {
      this.pointerInsidePanel = false;
      // dragging the scrollbar drifts outside the panel constantly; the release closes it instead
      if (!this.pointerHeld) this.scheduleHide();
    });
    panel.addEventListener("pointerdown", () => {
      this.pointerHeld = true;
      this.clearHide();
    });
    document.body.append(panel);
    this.panelElement = panel;
    return panel;
  }

  private static element(tag: string, className: string, text?: string): HTMLElement {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  private buildContent(): HTMLElement[] {
    const selection = this.getSelection();
    const nodes: HTMLElement[] = [];

    const header = SourceSelectionPreview.element("header", "ddb-source-preview-header");
    header.append(SourceSelectionPreview.element("h4", "", "Sources this import will use"));
    header.append(SourceSelectionPreview.element(
      "span",
      "hint",
      `${selection.categories.length} categories, ${selection.bookCount} books`,
    ));
    nodes.push(header);

    if (selection.bookFilterActive) {
      nodes.push(SourceSelectionPreview.element(
        "p",
        "ddb-source-preview-note",
        "Book filter on: only the books listed below are requested.",
      ));
    }
    if (selection.ignoredBooks.length > 0) {
      nodes.push(SourceSelectionPreview.element(
        "p",
        "ddb-source-preview-note",
        `Book filter entries ignored, they sit outside the included categories: ${selection.ignoredBooks.join(", ")}.`,
      ));
    }

    const body = SourceSelectionPreview.element("div", "ddb-source-preview-body");
    if (selection.categories.length === 0) {
      body.append(SourceSelectionPreview.element(
        "p",
        "ddb-source-preview-empty",
        "No sources are selected, so only homebrew can be imported.",
      ));
    }
    for (const category of selection.categories) {
      const box = SourceSelectionPreview.element("section", "ddb-source-preview-category");
      const categoryHeader = SourceSelectionPreview.element("header", "");
      categoryHeader.append(SourceSelectionPreview.element("h5", "", category.name));
      categoryHeader.append(SourceSelectionPreview.element("span", "", String(category.books.length)));
      box.append(categoryHeader);
      const list = SourceSelectionPreview.element("ul", "");
      for (const book of category.books) {
        const item = SourceSelectionPreview.element("li", "", book.name);
        item.title = book.code;
        list.append(item);
      }
      box.append(list);
      body.append(box);
    }
    nodes.push(body);

    return nodes;
  }

  /**
   * Pin the panel above the button, dropping below it when there is no room, and keep it inside
   * the viewport horizontally. Measured after the content is in place so the real size is used.
   * @param {HTMLElement} button  The anchor.
   */
  private position(button: HTMLElement): void {
    const panel = this.panelElement;
    if (!panel) return;
    const margin = SourceSelectionPreview.MARGIN_PX;
    const anchor = button.getBoundingClientRect();
    const { width, height } = panel.getBoundingClientRect();

    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const left = Math.min(Math.max(anchor.left + (anchor.width / 2) - (width / 2), margin), maxLeft);

    const above = anchor.top - height - margin;
    const below = anchor.bottom + margin;
    const top = above >= margin
      ? above
      : Math.max(margin, Math.min(below, window.innerHeight - height - margin));

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  }

}
