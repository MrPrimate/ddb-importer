import { utils } from "../../lib/_module.mjs";
import { createAndShowPlayerHandout, imageToChat } from "./shared.js";


class DDBJournalSheet extends dnd5e.applications.journal.JournalEntrySheet5e {
  constructor(doc, options) {
    super(doc, options);
    this.options.classes.push("ddb-journal", "themed", "theme-light");
  }

  async _linkImages() {
    const data = this.document;
    this.element.querySelectorAll('img').forEach((element) => {
      // Create buttons
      const showPlayersButton = document.createElement('a');
      showPlayersButton.className = 'ddbimporter-show-image';
      showPlayersButton.innerHTML = '<i class="fas fa-eye"></i>&nbsp;Show Players Image';

      const toChatButton = document.createElement('a');
      toChatButton.className = 'ddbimporter-to-chat';
      toChatButton.innerHTML = '<i class="fas fa-comment"></i>&nbsp;To Chat';

      // Wrap image in container
      const container = document.createElement('div');
      container.className = 'ddbimporter-image-container';
      element.parentNode.insertBefore(container, element);
      container.appendChild(element);

      // Mouse enter event
      container.addEventListener('mouseenter', function addHover() {
        // eslint-disable-next-line no-invalid-this
        this.appendChild(showPlayersButton);
        // eslint-disable-next-line no-invalid-this
        this.appendChild(toChatButton);

        // Show players button click handler
        showPlayersButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const src = element.getAttribute('src');
          Dialog.confirm({
            title: "Would you like to create a handout for the image?",
            content: "<p>Create a player viewable handout? (No will show the image only)</p>",
            yes: async () => {
              const name = await utils.namePrompt("What would you like to call the Handout?");
              if (name && name !== "") {
                const bookCode = data.flags?.ddb?.bookCode;
                createAndShowPlayerHandout(name, src, "image", bookCode);
              }
            },
            no: () => {
              const popOut = new ImagePopout(src, { shareable: true });
              popOut.shareImage();
            },
            defaultYes: true,
          });
        });

        // To chat button click handler
        toChatButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          imageToChat(element.getAttribute('src'));
        });
      });

      // Mouse leave event
      container.addEventListener('mouseleave', function removeHover() {
        // eslint-disable-next-line no-invalid-this
        const buttons = this.querySelectorAll('a.ddbimporter-show-image, a.ddbimporter-to-chat');
        buttons.forEach((button) => button.remove());
      });
    });
  }

  async linkTables() {
    // Process each matching link
    const links = this.element.querySelectorAll("a.content-link[data-type='RollTable']");

    for (const link of links) {
      if (!link.dataset?.uuid) continue;
      const table = await fromUuid(link.dataset.uuid);

      if (!table) continue;
      const button = document.createElement('a');
      button.title = "Click: Roll | Shift-Click: Self Roll";
      button.className = "ddbimporter roll";
      button.innerHTML = '<i class="fas fa-dice-d20"></i> Roll!';

      link.insertAdjacentElement('afterend', button);

      button.addEventListener('click', async (event) => {
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

  async _onRender(context, options) {
    await super._onRender(context, options);

    if (!game.user.isGM) return;

    if (game.settings.get("ddb-importer", "show-image-to-players")) this._linkImages();
    await this.linkTables();
  }
}

export function registerJournalSheet() {
  foundry.applications.apps.DocumentSheetConfig.registerSheet(JournalEntry, "ddb-importer", DDBJournalSheet, {
    // types: ["base"],
    label: "D&D Beyond Journal",
    makeDefault: false,
    themes: {
      light: "SETTINGS.UI.FIELDS.colorScheme.choices.light",
    },
  });
}
