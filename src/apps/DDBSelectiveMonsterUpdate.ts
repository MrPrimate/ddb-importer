import DDBAppV2 from "./DDBAppV2";
import {
  logger,
  CompendiumHelper,
  DDBItemImporter,
  utils,
} from "../lib/_module";

interface IFilterOption {
  value: string;
  label: string;
}

interface IMonsterEntry {
  id: string;
  name: string;
  nameLower: string;
  source: string;
  type: string;
  label: string;
}

interface ISelectiveMonsterUpdateContext {
  tabs: IDDBTabs;
  sourceBooks: IFilterOption[];
  creatureTypes: IFilterOption[];
  monsters: IMonsterEntry[];
  monsterCount: number;
}

export default class DDBSelectiveMonsterUpdate extends DDBAppV2 {

  selectedSources: string[] = [];
  selectedTypes: string[] = [];
  nameFilter = "";

  static DEFAULT_OPTIONS = {
    id: "ddb-selective-monster-update",
    classes: ["standard-form", "dnd5e2", "ddb-monster-select-dialog"],
    window: {
      title: "Select World Monsters to Update",
      icon: "fas fa-filter",
      resizable: true,
    },
    tag: "form",
    actions: {
      updateSelected: DDBSelectiveMonsterUpdate.updateSelected,
      updateAllVisible: DDBSelectiveMonsterUpdate.updateAllVisible,
      cancel: DDBSelectiveMonsterUpdate.cancel,
    },
    position: { width: 700, height: 700 },
  };

  static PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/monster-select/monster-select.hbs",
    },
    footer: {
      template: "modules/ddb-importer/handlebars/monster-select/footer.hbs",
    },
  };

  _getTabs(): IDDBTabs {
    return {};
  }

  async _prepareContext(options): Promise<ISelectiveMonsterUpdateContext> {
    const context: ISelectiveMonsterUpdateContext = await super._prepareContext({ ...options, noCacheLoad: true }) as ISelectiveMonsterUpdateContext;

    const worldMonsters = game.actors.filter((a) =>
      a.type === "npc" && foundry.utils.hasProperty(a, "flags.ddbimporter.id"),
    );

    const sourceBooks = new Set<string>();
    const creatureTypes = new Set<string>();

    for (const actor of worldMonsters) {
      const book = foundry.utils.getProperty(actor, "system.source.book") as string;
      if (book) sourceBooks.add(book);
      const cType = foundry.utils.getProperty(actor, "system.details.type.value") as string;
      if (cType) creatureTypes.add(cType);
    }

    context.sourceBooks = [...sourceBooks].sort().map((b) => ({
      value: b,
      label: `${CONFIG.DND5E.sourceBooks[b] ?? b} (${b})`,
    }));

    context.creatureTypes = [...creatureTypes].sort().map((t) => ({
      value: t,
      label: CONFIG.DND5E.creatureTypes[t]?.label ?? t,
    }));

    const sorted = [...worldMonsters].sort((a, b) => a.name.localeCompare(b.name));
    context.monsters = sorted.map((actor) => {
      const source = foundry.utils.getProperty(actor, "system.source.book") as string ?? "";
      const type = foundry.utils.getProperty(actor, "system.details.type.value") as string ?? "";
      const typeLabel = CONFIG.DND5E.creatureTypes[type]?.label ?? type;
      const bookLabel = source ? (CONFIG.DND5E.sourceBooks[source] ?? source) : "";
      return {
        id: actor.id,
        name: actor.name,
        nameLower: actor.name.toLowerCase(),
        source,
        type,
        label: `${actor.name} (${typeLabel}${bookLabel ? `, ${bookLabel} (${source})` : ""})`,
      };
    });

    context.monsterCount = context.monsters.length;
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    const sourceFilter = this.element.querySelector(".ddb-filter-source");
    const typeFilter = this.element.querySelector(".ddb-filter-type");
    const nameFilter = this.element.querySelector(".ddb-filter-name");

    const applyFilters = () => {
      this.selectedSources = sourceFilter ? Array.from(sourceFilter._value) : [];
      this.selectedTypes = typeFilter ? Array.from(typeFilter._value) : [];
      this.nameFilter = nameFilter?.value?.toLowerCase() ?? "";
      this._applyFilters();
    };

    sourceFilter?.addEventListener("change", applyFilters);
    typeFilter?.addEventListener("change", applyFilters);
    nameFilter?.addEventListener("input", applyFilters);
  }

  _applyFilters() {
    const entries = this.element.querySelectorAll(".ddb-monster-entry") as NodeListOf<HTMLElement>;
    let visibleCount = 0;

    entries.forEach((entry) => {
      const matchSource = this.selectedSources.length === 0 || this.selectedSources.includes(entry.dataset.source);
      const matchType = this.selectedTypes.length === 0 || this.selectedTypes.includes(entry.dataset.type);
      const matchName = !this.nameFilter || entry.dataset.name.includes(this.nameFilter);
      const visible = matchSource && matchType && matchName;
      entry.style.display = visible ? "" : "none";
      if (visible) visibleCount++;
    });

    const countEl = this.element.querySelector(".ddb-monster-visible-count");
    if (countEl) countEl.textContent = String(visibleCount);
  }

  _getSelectedActorIds(): string[] {
    const checked = this.element.querySelectorAll("input[name=\"actor-ids\"]:checked") as NodeListOf<HTMLInputElement>;
    return Array.from(checked).map((el) => el.value);
  }

  _getVisibleActorIds(): string[] {
    const visible = this.element.querySelectorAll(".ddb-monster-entry:not([style*=\"display: none\"]) input[name=\"actor-ids\"]") as NodeListOf<HTMLInputElement>;
    return Array.from(visible).map((el) => el.value);
  }

  async _performUpdate(actorIds: string[]) {
    if (actorIds.length === 0) {
      ui.notifications.warn("No monsters selected for update.");
      return;
    }

    const monsterCompendiumLabel = CompendiumHelper.getCompendiumLabel("monster");
    const monsterCompendium = CompendiumHelper.getCompendium(monsterCompendiumLabel);
    if (!monsterCompendium) {
      logger.error("Error opening compendium, check your settings");
      return;
    }

    const monsterIndices = ["name", "flags.ddbimporter.id"];
    const index = await monsterCompendium.getIndex({ fields: monsterIndices });
    const selectedActors = actorIds.map((id) => game.actors.get(id)).filter(Boolean);

    const totalTargets = selectedActors.length;
    let count = 0;

    utils.munchNote(`Updating ${count}/${totalTargets} selected world monsters`);

    for (const actor of selectedActors) {
      const compendiumMatch = index.find((entry) =>
        entry.name === actor.name
        && entry.flags?.ddbimporter?.id == actor.flags?.ddbimporter?.id,
      );

      if (compendiumMatch) {
        count++;
        utils.munchNote(`Updating ${count}/${totalTargets}: ${actor.name}`, { nameField: true });
        const monster = await monsterCompendium.getDocument(compendiumMatch._id);
        await DDBSelectiveMonsterUpdate._updateActorWithSource(actor, monster);
      } else {
        count++;
        logger.warn(`No compendium match found for ${actor.name} (ddbId: ${actor.flags?.ddbimporter?.id})`);
      }
    }

    utils.munchNote(`Finished updating ${totalTargets} selected world monsters`);
    utils.munchNote("", { nameField: true });
    ui.notifications.info(`Updated ${totalTargets} world monsters from compendium.`);
    await this.close();
  }

  static async _updateActorWithSource(targetActor, sourceActor) {
    const monsterItems = sourceActor.items.toObject().map((item) => {
      delete item._id;
      return item;
    });
    const actorUpdate = foundry.utils.duplicate(sourceActor);
    delete actorUpdate.items;

    const updateImages = game.settings.get("ddb-importer", "munching-policy-update-world-monster-update-images");
    if (!updateImages) {
      actorUpdate.img = targetActor.img;
      actorUpdate.prototypeToken.texture = targetActor.prototypeToken.texture;
      actorUpdate.prototypeToken.randomImg = targetActor.prototypeToken.randomImg;
      actorUpdate.prototypeToken.lockRotation = targetActor.prototypeToken.lockRotation;
      actorUpdate.prototypeToken.rotation = targetActor.prototypeToken.rotation;
      actorUpdate.prototypeToken.alpha = targetActor.prototypeToken.alpha;
      actorUpdate.prototypeToken.ring = targetActor.prototypeToken.ring;
    }

    const retainBiography = game.settings.get("ddb-importer", "munching-policy-update-world-monster-retain-biography");
    if (retainBiography) {
      actorUpdate.system.details.biography = targetActor.system.details.biography;
    }

    actorUpdate._id = targetActor.id;
    if (targetActor.folder) actorUpdate.folder = targetActor.folder._id;
    actorUpdate.sort = targetActor.sort;
    actorUpdate.ownership = targetActor.ownership;
    DDBItemImporter.copySupportedItemFlags(targetActor, actorUpdate);
    await targetActor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
    await targetActor.update(actorUpdate);
    await targetActor.createEmbeddedDocuments("Item", monsterItems);
  }

  static async updateSelected(this: DDBSelectiveMonsterUpdate) {
    const ids = this._getSelectedActorIds();
    await this._performUpdate(ids);
  }

  static async updateAllVisible(this: DDBSelectiveMonsterUpdate) {
    const ids = this._getVisibleActorIds();
    await this._performUpdate(ids);
  }

  static async cancel(this: DDBSelectiveMonsterUpdate) {
    await this.close();
  }

}
