import { utils } from "../../lib/_module";
import { createAndShowPlayerHandout, imageToChat } from "./shared";
import { getPendingImages, waitForImage } from "./journalAnchorScroll";


// the runtime targets dnd5e 5.3+ where the class is JournalEntrySheet5e (App V2);
// the bundled type package predates the rename, so provide a minimal shape
const JournalEntrySheet5eBase = (dnd5e.applications.journal as unknown as
  Record<string, new (...args: any[]) => {
    options: { classes: string[] } & Record<string, any>;
    document: JournalEntry.Implementation & Record<string, any>;
    element: HTMLElement;
    pageId?: string;
    render: (options?: unknown) => unknown;
  } & Record<string, any>>).JournalEntrySheet5e;

class DDBJournalSheet extends JournalEntrySheet5eBase {
  constructor(doc: any, options: Record<string, any>) {
    super(doc, options);
    this.options.classes.push("ddb-journal", "themed", "theme-light");
  }

  async _linkImages() {
    const data = this.document;
    this.element.querySelectorAll("img").forEach((element) => {
      if ((element.parentNode as HTMLElement | null)?.classList?.contains("ddbimporter-image-container")) return;

      // Create buttons
      const showPlayersButton = document.createElement("a");
      showPlayersButton.className = "ddbimporter-show-image";
      showPlayersButton.innerHTML = "<i class=\"fas fa-eye\"></i>&nbsp;Show Players Image";

      const toChatButton = document.createElement("a");
      toChatButton.className = "ddbimporter-to-chat";
      toChatButton.innerHTML = "<i class=\"fas fa-comment\"></i>&nbsp;To Chat";

      showPlayersButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const src = element.getAttribute("src");
        if (!src) return;
        Dialog.confirm({
          title: "Would you like to create a handout for the image?",
          content: "<p>Create a player viewable handout? (No will show the image only)</p>",
          yes: async () => {
            const name = await utils.namePrompt("What would you like to call the Handout?");
            if (name && name !== "") {
              const bookCode = (data.flags?.ddb?.bookCode ?? null) as string | null;
              createAndShowPlayerHandout(name as string, src, "image", bookCode);
            }
          },
          no: () => {
            const popOut = new ImagePopout(src, { shareable: true } as unknown as ConstructorParameters<typeof ImagePopout>[1]);
            popOut.shareImage();
          },
          defaultYes: true,
        });
      });

      toChatButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const src = element.getAttribute("src");
        if (src) imageToChat(src);
      });

      // Wrap image in container
      const parentNode = element.parentNode;
      if (!parentNode) return;
      const container = document.createElement("div");
      container.className = "ddbimporter-image-container";
      parentNode.insertBefore(container, element);
      container.appendChild(element);

      // Mouse enter event
      container.addEventListener("mouseenter", function addHover() {
        this.appendChild(showPlayersButton);
        this.appendChild(toChatButton);
      });

      // Mouse leave event
      container.addEventListener("mouseleave", function removeHover() {
         
        const buttons = this.querySelectorAll("a.ddbimporter-show-image, a.ddbimporter-to-chat");
        buttons.forEach((button) => button.remove());
      });
    });
  }

  async linkTables() {
    // Process each matching link
    const links = this.element.querySelectorAll("a.content-link[data-type='RollTable']");

    for (const link of links as NodeListOf<HTMLElement>) {
      if (!link.dataset?.uuid) continue;
      const table = await fromUuid(link.dataset.uuid) as unknown as {
        name: string;
        description?: string;
        roll: () => Promise<{ results: any[]; roll: Roll }>;
        toMessage: (results: any[], options: Record<string, any>) => Promise<unknown>;
      } | null;

      if (!table) continue;
      const button = document.createElement("a");
      button.title = "Click: Roll | Shift-Click: Self Roll";
      button.className = "ddbimporter roll";
      button.innerHTML = "<i class=\"fas fa-dice-d20\"></i> Roll!";

      link.insertAdjacentElement("afterend", button);

      button.addEventListener("click", async (event) => {
        event.preventDefault();
        const rollMode = event.shiftKey ? "selfroll" : "roll";

        // fix: Table description is undefined
        if (!table.description) table.description = table.name;

        const draw = await table.roll();

        draw.results = draw.results.map((result) => {
          if (!result.img) {
            result.img = "icons/svg/d20-highlight.svg";
          }
          return result;
        });

        await table.toMessage(draw.results, {
          roll: draw.roll,
          messageOptions: {
            speaker: game.user.name,
            rollMode: rollMode,
          },
        });
      });
    }
  }

  // Re-scroll to the anchor heading once page images have loaded, so it lands
  // at the top instead of mid-page. Mirrors core goToPage/_onRender:
  // getPageSheet(pageId).toc[anchor].element + plain scrollIntoView().
  async _scrollToAnchorAfterImages(anchor: string) {
    if (!anchor) return;
    const pageSheet = this.getPageSheet(this.pageId);
    if (!pageSheet?.toc?.[anchor]?.element) return;

    const pending = getPendingImages(pageSheet.element);
    if (pending.length > 0) {
      // Timeout guard: a stuck image must not hang the scroll.
      await Promise.race([
        Promise.all(pending.map((img) => waitForImage(img))),
        utils.wait(1500),
      ]);
    }

    // Re-resolve in case the page re-rendered while we awaited.
    this.getPageSheet(this.pageId)?.toc?.[anchor]?.element?.scrollIntoView();
  }

  async _onRender(context: Record<string, any>, options: Record<string, any>) {
    await super._onRender(context, options);

    // Run before the GM guard so the anchor scroll applies to players too.
    await this._scrollToAnchorAfterImages(options?.anchor);

    if (!game.user.isGM) return;

    if (utils.getSetting<boolean>("show-image-to-players")) this._linkImages();
    await this.linkTables();
  }
}

export function registerJournalSheet() {
  foundry.applications.apps.DocumentSheetConfig.registerSheet(JournalEntry as unknown as Parameters<typeof foundry.applications.apps.DocumentSheetConfig.registerSheet>[0], "ddb-importer", DDBJournalSheet as unknown as Parameters<typeof foundry.applications.apps.DocumentSheetConfig.registerSheet>[2], {
    // types: ["base"],
    label: "D&D Beyond Journal",
    makeDefault: false,
    themes: {
      light: "SETTINGS.UI.FIELDS.colorScheme.choices.light",
    },
  });
}
