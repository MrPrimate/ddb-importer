import {
  utils,
  logger,
  DDBItemImporter,
  FolderHelper,
} from "../../lib/_module";
import DDBCompanion2014 from "./DDBCompanion2014";
import { isEqual } from "../../../vendor/lowdash/_module.mjs";
import DDBSummonsManager from "./DDBSummonsManager";
import { DDBBasicActivity } from "../activities/_module";
import DDBCompanion2024 from "./DDBCompanion2024";
import { CR_DATA } from "./types/CRSRD";
import { DICTIONARY } from "../../config/_module";
import { getFindFamiliarActivityData } from "./types/FindFamiliar";
import DDBMonsterFactory from "../DDBMonsterFactory";
import DDBMonsterImporter from "../../muncher/DDBMonsterImporter";

type TDDBOriginDocument = TAll5eItemDocuments | TAll5eActorDocuments;

interface DDBCompanionFactoryOptions {
  originDocument?: TDDBOriginDocument;
  is2014?: boolean;
  is2024?: boolean;
  notifier?: any;
  actor?: Actor.Implementation | null;
  data?: I5eMonsterData[];
  folderHint?: string;
  createCompanions?: boolean;
  updateCompanions?: boolean;
  updateImages?: boolean;
  noCompendiums?: boolean;
  type?: string;
}

export default class DDBCompanionFactory {
  actor: Actor.Implementation | null;
  originDocument: TDDBOriginDocument | null;
  options: DDBCompanionFactoryOptions;
  doc: Document;
  html: string;
  folderIds: Set<string>;
  createCompanions: boolean;
  updateCompanions: boolean;
  updateImages: boolean;
  results: { created: any[]; updated: any[] };
  is2014: boolean;
  is2024: boolean;
  badSummons: boolean;
  noCompendiums: boolean;
  indexFilter: { fields: string[] };
  notifier: (note: any, { nameField, monsterNote, isError, message }?: NotifierV1Props) => void;
  summonsManager: DDBSummonsManager;
  itemHandler: DDBItemImporter | null;
  companions: (DDBCompanion2014 | DDBCompanion2024)[];
  templates: (DDBCompanion2014 | DDBCompanion2024)[];
  statBlocks: IDDBCompanionStatBlock[];
  // stat block index -> actor uuids to embed, set once the companions are stored
  statBlockEmbeds: Map<number, string[]> | null;
  originName: string;
  summons: I5eSummonActivity | null;

  constructor(html: string, options: DDBCompanionFactoryOptions = {}) {
    const defaultOptions: DDBCompanionFactoryOptions = {
      originDocument: null,
      is2014: null,
      is2024: null,
      notifier: null,
      actor: null,
      data: null,
      folderHint: null,
      createCompanions: true,
      updateCompanions: true,
      updateImages: false,
    };
    // console.warn("html", html);
    this.options = Object.assign({}, defaultOptions, options);
    this.html = html;
    this.doc = new DOMParser().parseFromString(html.replaceAll("\n", ""), "text/html");
    this.companions = [];
    this.templates = [];
    this.statBlocks = [];
    this.statBlockEmbeds = null;
    this.actor = this.options.actor ?? null;
    this.folderIds = new Set();
    this.createCompanions = this.options.createCompanions;
    this.updateCompanions = this.options.updateCompanions; //  game.settings.get("ddb-importer", "munching-policy-update-existing");
    this.updateImages = this.options.updateImages; // game.settings.get("ddb-importer", "munching-policy-update-images");
    this.results = {
      created: [],
      updated: [],
    };
    this.originDocument = this.options.originDocument;
    this.originName = foundry.utils.getProperty(this.originDocument, "flags.ddbimporter.originalName") as string
      ?? this.originDocument?.name
      ?? null;
    this.is2014 = this.options.is2014;
    this.is2024 = !this.options.is2014 || this.options.is2024;
    this.summons = null;
    this.badSummons = false;
    this.noCompendiums = this.options.noCompendiums ?? false;
    this.indexFilter = { fields: [
      "name",
      "flags.ddbimporter.compendiumId",
      "flags.ddbimporter.id",
      "flags.ddbimporter.summons",
      "system.source.rules",
    ] };
    this.notifier = this.options.notifier;
    this.summonsManager = new DDBSummonsManager({ notifier: this.notifier });
    this.itemHandler = null;
  }

  /**
   * Opens the summons compendium. Without one (a broken setup) the companions still parse so the
   * origin document keeps its summon activity, they just cannot be stored.
   */
  async init() {
    try {
      await this.summonsManager.init();
      this.itemHandler = this.summonsManager.itemHandler;
    } catch (err) {
      logger.error(`Unable to open the summons compendium, companions for ${this.originName} will not be stored: ${utils.errorMessage(err)}`);
      this.itemHandler = null;
    }
  }

  get data(): I5eMonsterData[] {
    return this.options.data ?? this.companions.map((c) => c.data);
  }

  get templateData(): I5eMonsterData[] {
    return this.templates.map((c) => c.data);
  }

  static STAT_BLOCK_SELECTOR_2014 = "div.stat-block-background, div.stat-block-finder, div.basic-text-frame";

  static STAT_BLOCK_SELECTOR_2024 = "div.stat-block";

  /** Our secret sections around stat blocks carry ids with this prefix. */
  static STAT_BLOCK_SECTION_PREFIX = "secret-ddb-statblock-";

  /** The stat block's title, in title case ("BATTLE FAMILIAR" is "Battle Familiar"). */
  static blockName(block: Element, is2014: boolean): string {
    const title = is2014
      ? block.querySelector("p.Stat-Block-Styles_Stat-Block-Title")
      : block.querySelector("h3.compendium-hr, h4.compendium-hr, h5.compendium-hr, h4");
    return (title?.textContent ?? "")
      .trim()
      .toLowerCase()
      .split(/\s/)
      .map((w) => utils.capitalize(w.trim()))
      .join(" ");
  }

  /**
   * The stat blocks in a parsed description, outermost only: 2014 frames can nest, and one block
   * must not be read (or replaced) twice.
   */
  static findStatBlocks(doc: Document, is2014: boolean): HTMLElement[] {
    const selector = is2014 ? DDBCompanionFactory.STAT_BLOCK_SELECTOR_2014 : DDBCompanionFactory.STAT_BLOCK_SELECTOR_2024;
    return Array.from(doc.querySelectorAll<HTMLElement>(selector))
      .filter((block) => !block.parentElement?.closest(selector));
  }

  static MULTI_2014 = DICTIONARY.companions.MULTI_COMPANIONS_2014;

  static MULTI_2024 = DICTIONARY.companions.MULTI_COMPANIONS_2024;

  /**
   * The forms of a multi-companion stat block that its text actually names. A table entry may
   * list the forms of several printings (Summon Plant's GHPG and Arcana Unleashed sets), and
   * building a form the block never mentions yields a bad actor. When the text
   * names none of them the whole list is kept, so a block that describes its forms elsewhere
   * still builds as before.
   */
  static subTypesInBlock(name: string, text: string): string[] {
    const subTypes = DDBCompanionFactory.MULTI_2024[name] ?? [];
    const present = subTypes.filter((subType) => new RegExp(`\\b${subType}\\b`, "i").test(text));
    return present.length > 0 ? present : subTypes;
  }

  async #buildCompanion(block: HTMLElement, options: IDDBCompanionMixinOptions = {}): Promise<DDBCompanion2014 | DDBCompanion2024 | null> {
    logger.debug("Beginning companion parse", { block });
    const finalOverrides = {
      rules: this.is2014 ? "2014" : "2024",
      type: this.options.type,
      folderHint: this.options.folderHint,
    };
    const finalOptions = foundry.utils.mergeObject(options, finalOverrides);

    const ddbCompanion = this.is2014
      ? new DDBCompanion2014(block, finalOptions)
      : new DDBCompanion2024(block, finalOptions);
    await ddbCompanion.parse();
    if (ddbCompanion.parsed) {
      this.companions.push(ddbCompanion);
      const companionSummons = foundry.utils.deepClone(ddbCompanion.summons);
      const existingSummons = this.summons
        ? foundry.utils.deepClone(this.summons)
        : null;
      const summonMatch = isEqual(companionSummons, existingSummons);

      // console.warn("Companion Parsed DISCOVERY", {
      //   ddbCompanion,
      //   companionSummons,
      //   existingSummons,
      //   summonMatch,
      //   this: this
      // });
      if (this.summons === null) {
        this.summons = foundry.utils.deepClone(ddbCompanion.summons);
      } else if (!summonMatch) {
        logger.warn("Companion Factory has generated different summons", {
          existingSummons,
          companionSummons,
          factory: this,
          ddbCompanion,
          equal: isEqual(existingSummons, existingSummons),
          summonMatch,
        });
        this.badSummons = false;
      }
      return ddbCompanion;
    }
    return null;
  }

  /**
   * The combined actor for a multi-form stat block, as the official modules keep in their
   * "Summon Templates": all traits with their "(Air Only)" names and the block's own text for the
   * values that differ by form. It is only embedded in the description, never summoned, so its
   * summon data is discarded.
   */
  async #buildTemplate(block: HTMLElement, name: string): Promise<DDBCompanion2014 | DDBCompanion2024 | null> {
    const options: IDDBCompanionMixinOptions = {
      name,
      subType: undefined,
      template: true,
      rules: this.is2014 ? "2014" : "2024",
      type: this.options.type,
      folderHint: this.options.folderHint,
    };
    const template = this.is2014
      ? new DDBCompanion2014(block, options)
      : new DDBCompanion2024(block, options);
    try {
      await template.parse();
    } catch (error) {
      logger.warn(`Unable to build the stat block template for ${name}, embedding its forms instead`, error);
      return null;
    }
    if (!template.parsed) return null;
    this.templates.push(template);
    return template;
  }

  /** Builds a stat block's companions, its template when it has several forms, and records them. */
  async #buildStatBlock(block: HTMLElement, name: string, subTypes: string[] | null) {
    const built: (DDBCompanion2014 | DDBCompanion2024)[] = [];
    if (subTypes) {
      for (const subType of subTypes) {
        const companion = await this.#buildCompanion(block, { name, subType });
        if (companion) built.push(companion);
      }
    } else {
      const companion = await this.#buildCompanion(block, { name, subType: undefined });
      if (companion) built.push(companion);
    }
    if (built.length === 0) return;

    // the companion key, a string on companions although monster flags type it as a DDB id
    const key = (c: DDBCompanion2014 | DDBCompanion2024) => foundry.utils.getProperty(c.data, "flags.ddbimporter.id") as string;
    const template = built.length > 1 ? await this.#buildTemplate(block, name) : null;
    this.statBlocks.push({
      name,
      companionIds: built.map(key),
      templateId: template ? key(template) : null,
    });
  }

  async _parse2014() {

    await this.init();

    this.statBlocks = [];
    this.templates = [];
    for (const block of DDBCompanionFactory.findStatBlocks(this.doc, true)) {
      const name = DDBCompanionFactory.blockName(block, true);
      const subTypes = name && name in DDBCompanionFactory.MULTI_2014
        ? DDBCompanionFactory.MULTI_2014[name]
        : null;
      await this.#buildStatBlock(block, name, subTypes);
    }

    return this.data;
  }

  async _parse2024() {

    await this.init();

    this.statBlocks = [];
    this.templates = [];
    for (const block of DDBCompanionFactory.findStatBlocks(this.doc, false)) {
      const name = DDBCompanionFactory.blockName(block, false);
      const subTypes = name && name in DDBCompanionFactory.MULTI_2024
        ? DDBCompanionFactory.subTypesInBlock(name, block.textContent ?? "")
        : null;
      await this.#buildStatBlock(block, name, subTypes);
    }

    return this.data;
  }

  async parse() {
    if (this.is2014) await this._parse2014();
    else await this._parse2024();
  }

  async #generateCompanionFolders(rootFolderName = "DDB Companions") {
    const rootFolder = await FolderHelper.getOrCreateFolder(null, "Actor", rootFolderName);
    for (const companion of this.companions) {
      const folder = await FolderHelper.getOrCreateFolder(rootFolder, "Actor", utils.capitalize(companion.type ?? "other"));
      companion.data.folder = folder._id;
      this.folderIds.add(folder._id);
    }
  }

  /**
   * The stored actors for this factory's companions. Templates are only wanted when storing them;
   * they must never become summon profiles.
   */
  async getExistingCompendiumCompanions({ includeTemplates = false }: { includeTemplates?: boolean } = {}): Promise<Actor.Implementation[]> {
    const itemHandler = this.itemHandler;
    if (!itemHandler) {
      logger.warn("Companion item handler not initialised, unable to fetch existing compendium companions");
      return [];
    }
    await itemHandler.buildIndex(this.indexFilter);
    const compendiumIndex = itemHandler.compendiumIndex;
    if (!compendiumIndex) {
      logger.warn("Companion compendium index not built, unable to fetch existing compendium companions");
      return [];
    }

    const ids = new Set([
      ...this.companions,
      ...(includeTemplates ? this.templates : []),
    ].map((c) => foundry.utils.getProperty(c, "data.flags.ddbimporter.id")));
    const existingCompanions = await Promise.all(compendiumIndex
      .filter((companion) => foundry.utils.hasProperty(companion, "flags.ddbimporter.id")
        && ids.has(companion.flags.ddbimporter.id),
      )
      .map(async (companion) => this.itemHandler.compendium.getDocument(companion._id)),
    ) as unknown as Actor.Implementation[];

    return existingCompanions;
  }

  async getExistingWorldCompanions({ folderOverride = null, rootFolderNameOverride = undefined, limitToFactory = false } = {}) {
    if (game.user.isGM && !this.noCompendiums) return [];
    if (!folderOverride) await this.#generateCompanionFolders(rootFolderNameOverride);

    const companionNames = limitToFactory ? this.data.map((c) => c.name) : [];
    logger.debug("Matched companion names", companionNames);

    const existingCompanions = await game.actors.contents
      .filter((companion) => foundry.utils.hasProperty(companion, "folder.id")
        && ((!folderOverride && this.folderIds.has(companion.folder.id))
          || folderOverride?.id === companion.folder.id)
        && (!limitToFactory || (limitToFactory && companionNames.includes(companion.name))),
      )
      .map((companion) => companion);
    return existingCompanions;
  }

  static async addToWorld(companion, update) {
    const results = [];
    if (!game.user.can("ITEM_CREATE")) return results;
    const npcBuilder = new DDBMonsterImporter({ monster: companion, type: "monster" });
    await npcBuilder.build({
      temporary: false,
      update,
      addToWorld: true,
    });
    const npc = npcBuilder.data;
    results.push(npc);
    return results;
  }

  async #updateCompanions(companions, existingCompanions) {
    const updateCompanions = companions.filter((companion) =>
      existingCompanions.some(
        (exist) =>
          exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
          && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
          && companion.system.source.rules === exist.system.source.rules,
      ));

    const results = [];

    // console.warn("Updating companions", { updateCompanions, existingCompanions, companions });
    for (const companion of updateCompanions) {
      const existingCompanion = await existingCompanions.find((exist) =>
        exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
        && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
        && companion.system.source.rules === exist.system.source.rules,
      );
      companion.folder = existingCompanion.folder?.id;
      companion._id = existingCompanion._id;
      logger.info(`Updating companion ${companion.name}`);
      DDBItemImporter.copySupportedItemFlags(existingCompanion, companion);
      // an older parsed companion is replaced whatever the "update existing" policy says
      const storedVersion = Number(foundry.utils.getProperty(existingCompanion, "flags.ddbimporter.summons.version") ?? 0);
      const outdated = storedVersion < Number(companion.flags?.ddbimporter?.summons?.version ?? 0);
      const willUpdate = this.noCompendiums || outdated || utils.getSetting<boolean>("munching-policy-update-existing");
      if (willUpdate) await DDBCompanionFactory.#clearStatBlockOverride(existingCompanion);
      const npc = !this.noCompendiums
        ? await this.summonsManager.addToCompendium(companion, outdated ? true : null)
        : await DDBCompanionFactory.addToWorld(companion, true);
      results.push(npc);
    }

    return results;
  }

  /**
   * Updating a stored companion merges its flags, so a stat block override key the new parse no
   * longer writes (a challenge line DDB has since dropped) would linger. Clear it first.
   */
  static async #clearStatBlockOverride(actor: Actor.Implementation) {
    if (!foundry.utils.hasProperty(actor, "flags.dnd5e.statBlockOverride")) return;
    await actor.unsetFlag("dnd5e", "statBlockOverride");
  }

  async #createCompanions(companions: I5eMonsterData[], existingCompanions: I5eMonsterData[], folderId?: string) {
    if (!game.user.can("ITEM_CREATE")) {
      ui.notifications.warn(`User is unable to create world items, and cannot create companions`);
      return [];
    }
    const newCompanions = companions.filter((companion) =>
      !existingCompanions.some(
        (exist) =>
          exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
          && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
          && companion.system.source.rules === exist.system.source.rules,
      ));

    const toCompendium = game.user.isGM && !this.noCompendiums;
    const usedIds = new Set<string>();
    const results = [];
    for (const companion of newCompanions) {
      logger.info(`Creating Companion ${companion.name}`);
      if (toCompendium) this.#assignStableId(companion, usedIds);
      logger.debug(`Companion data:`, {
        companion,
        folderId,
      });

      if (folderId) companion.folder = folderId;
      const importedCompanion = game.user.isGM && !this.noCompendiums
        ? await this.summonsManager.addToCompendium(companion)
        : await DDBCompanionFactory.addToWorld(companion, false);
      results.push(importedCompanion);
    }
    return results;
  }

  /**
   * A new compendium companion gets an id from its name and rules rather than a random one, so a
   * description's stat block embed still resolves after the summons compendium is rebuilt. An id
   * another actor already holds is left random: reusing it would overwrite that actor.
   */
  #assignStableId(companion: I5eMonsterData, usedIds: Set<string>) {
    const compendium = this.itemHandler?.compendium;
    if (!compendium) return;
    const isTemplate = foundry.utils.getProperty(companion, "flags.ddbimporter.summons.template") === true;
    const rules = companion.system.source?.rules === "2014" ? "14" : "24";
    const stableId = utils.namedIDStub(companion.name, { prefix: "ddbCom", postfix: `${isTemplate ? "T" : ""}${rules}` });
    if (compendium.index.has(stableId) || usedIds.has(stableId)) return;
    usedIds.add(stableId);
    companion._id = stableId;
    foundry.utils.setProperty(companion, "flags.ddbimporter.compendiumId", stableId);
  }

  async updateOrCreateCompanions({ folderOverride = null, rootFolderNameOverride = undefined }:{
    folderOverride?: Folder | null;
    rootFolderNameOverride?: string | undefined;
  } = {}) {
    const itemHandler = this.itemHandler;
    if (!itemHandler) {
      logger.warn("Companion item handler not initialised, unable to update or create companions");
      return;
    }

    const existingCompanions = this.noCompendiums
      ? await this.getExistingWorldCompanions({ folderOverride, rootFolderNameOverride })
      : await this.getExistingCompendiumCompanions({ includeTemplates: true });

    let companionData = this.data;

    if (!game.user.isGM) {
      this.itemHandler.documents = companionData;
      return;
    }

    // templates exist for description embeds, so a world-actor import has no use for them
    if (!this.noCompendiums) companionData = [...companionData, ...this.templateData];

    if (!this.updateCompanions || !this.updateImages) {
      if (!this.updateImages) {
        logger.debug("Copying monster images across...");
        companionData = DDBMonsterFactory.copyExistingMonsterImages(companionData, existingCompanions);
      }
    }

    this.itemHandler.documents = companionData;
    await this.itemHandler.iconAdditions();
    await this.itemHandler.generateIconMap();

    if (this.updateCompanions) {
      this.results.updated = await this.#updateCompanions(this.itemHandler.documents, existingCompanions);
    }
    if (this.createCompanions) {
      this.results.created = await this.#createCompanions(
        this.itemHandler.documents as unknown as I5eMonsterData[],
        existingCompanions as unknown as I5eMonsterData[],
        folderOverride?.id,
      );
    }
  }


  /** Stored actor uuids by companion key, from the summons compendium or, without one, the world. */
  async #storedActorUuids(): Promise<Map<string, string>> {
    const wanted = new Set(this.statBlocks.flatMap((s) => [...s.companionIds, ...(s.templateId ? [s.templateId] : [])]));
    const uuids = new Map<string, string>();
    const itemHandler = this.itemHandler;
    if (!this.noCompendiums && itemHandler) {
      await itemHandler.buildIndex(this.indexFilter);
      for (const entry of itemHandler.compendium.index.values()) {
        const id = foundry.utils.getProperty(entry, "flags.ddbimporter.id") as string | undefined;
        if (!id || !wanted.has(id) || uuids.has(id)) continue;
        uuids.set(id, entry.uuid ?? `Compendium.${itemHandler.compendium.collection}.Actor.${entry._id}`);
      }
    } else if (this.noCompendiums) {
      for (const actor of game.actors.contents) {
        const id = foundry.utils.getProperty(actor, "flags.ddbimporter.id") as string | undefined;
        if (!id || !wanted.has(id) || uuids.has(id)) continue;
        uuids.set(id, actor.uuid);
      }
    }
    return uuids;
  }

  /**
   * Resolve what each parsed stat block will be replaced with: its template, or every one of its
   * forms when there is no template. A block with any form missing (a player import, companion
   * creation turned off, no summons compendium) is kept as DDB's text instead, since a partial set
   * of forms would misdescribe it. Call once the companions are stored.
   */
  async prepareStatBlockEmbeds() {
    const embeds = new Map<number, string[]>();
    this.statBlockEmbeds = embeds;
    if (this.statBlocks.length === 0) return;
    let stored: Map<string, string>;
    try {
      stored = await this.#storedActorUuids();
    } catch (error) {
      logger.warn(`Unable to look up stored companions for ${this.originName}, keeping its stat blocks as text`, error);
      return;
    }
    this.statBlocks.forEach((statBlock, index) => {
      const templateUuid = statBlock.templateId ? stored.get(statBlock.templateId) : undefined;
      if (templateUuid) {
        embeds.set(index, [templateUuid]);
        return;
      }
      const formUuids = statBlock.companionIds.map((id) => stored.get(id));
      if (formUuids.every((uuid) => uuid)) embeds.set(index, formUuids as string[]);
    });
  }

  /**
   * Swap the description's companion stat blocks for embeds of the stored actors, inside a secret
   * section so they show on the sheet but not in chat cards (dnd5e enriches card descriptions
   * without secrets). A block with no stored actor keeps DDB's text, wrapped the same way. Safe to
   * run again on its own output. Does nothing until prepareStatBlockEmbeds has run.
   */
  rewriteStatBlocks(html: string): string {
    if (!html || !this.statBlockEmbeds || this.statBlocks.length === 0) return html;
    const doc = utils.htmlToDoc(html);
    const prefix = DDBCompanionFactory.STAT_BLOCK_SECTION_PREFIX;
    const used = new Set<number>();
    let changed = false;

    for (const block of DDBCompanionFactory.findStatBlocks(doc, this.is2014)) {
      const name = DDBCompanionFactory.blockName(block, this.is2014);
      const index = this.statBlocks.findIndex((s, i) => !used.has(i) && s.name === name);
      if (index === -1) continue;
      used.add(index);

      const uuids = this.statBlockEmbeds.get(index);
      const wrapper = block.closest<HTMLElement>(`section.secret[id^="${prefix}"]`);
      // already wrapped, and still nothing to embed
      if (wrapper && !uuids) continue;

      const target = wrapper ?? block;
      const section = doc.createElement("section");
      section.classList.add("secret");
      target.replaceWith(section);
      if (uuids) {
        section.id = `${prefix}${uuids[0].split(".").pop()}`;
        section.innerHTML = uuids
          .map((uuid) => `<p>@Embed[${uuid} caption=false cite=true statblock]</p>`)
          .join("");
      } else {
        section.id = `${prefix}${utils.idString(name)}`;
        section.append(block);
      }
      changed = true;
    }

    return changed ? doc.body.innerHTML : html;
  }

  static COMPANION_REMAP: Record<string, string> = {
    "Artificer Infusions": "Infusion: Homunculus Servant",
  };

  #getDocumentActivity(document = null) {
    const foundryDocument = document ?? this.originDocument;
    for (const id of Object.keys(foundryDocument.system.activities)) {
      const activity = foundryDocument.system.activities[id];
      if (activity.type === "summon") return activity;
    }
    const activity = new DDBBasicActivity({ type: "summon", foundryFeature: foundryDocument });
    activity.build();
    return activity.data;
  }

  async addCompanionsToDocuments(otherDocuments, activity = null, _enricherActivity = null) {
    if (!this.originDocument || !this.summons) return;
    const compendiumSummons = await this.getExistingCompendiumCompanions();
    const summonActors = compendiumSummons.length > 0
      ? compendiumSummons
      : await this.getExistingWorldCompanions({ limitToFactory: true });
    const profiles = summonActors
      .map((actor) => {
        return {
          _id: actor._id,
          name: actor.name,
          uuid: actor.uuid,
          count: null,
        };
      });
    const alternativeDocument = DDBCompanionFactory.COMPANION_REMAP[this.originName];
    const updateDocument = alternativeDocument
      ? (otherDocuments.find((s) =>
        s.name === alternativeDocument || s.flags.ddbimporter?.originalName === alternativeDocument,
      ) ?? this.originDocument)
      : this.originDocument;

    logger.debug("Companion Data Load", {
      activity,
      originDocument: updateDocument,
      profiles,
      activityProfiles: activity?.profiles,
      worldActors: summonActors,
      factory: this,
      summons: this.summons,
    });
    const summonsData = foundry.utils.deepClone(this.summons);
    if (!activity || activity.profiles.length === 0) {
      summonsData.profiles = profiles;
    } else {
      summonsData.profiles = activity.profiles;
    }

    if (activity) {
      if (activity.creatureTypes.length > 0) {
        summonsData.creatureTypes = activity.creatureTypes;
      }
      if (activity.creatureSizes.length > 0) {
        summonsData.creatureSizes = activity.creatureSizes;
      }
      if (activity.bonuses) {
        for (const [key, value] of Object.entries(activity.bonuses)) {
          if (value && value !== "") {
            summonsData.bonuses[key] = value;
          }
        }
      }
    }

    logger.debug("Final summons Data", {
      summonsData: foundry.utils.deepClone(summonsData),
      activity: foundry.utils.deepClone(activity),
      updateDocument: foundry.utils.deepClone(updateDocument),
    });

    const activityData = activity
      ? foundry.utils.mergeObject(activity, summonsData)
      : foundry.utils.mergeObject(this.#getDocumentActivity(updateDocument), summonsData);

    logger.debug("Final Activity Data", {
      activityData: foundry.utils.deepClone(activityData),
    });
    if ("activities" in this.originDocument.system) {
      delete this.originDocument.system.activities[activityData._id];
      updateDocument.system.activities[activityData._id] = activityData;
    }

  }

  async addCRSummoning(activity: I5eSummonActivity) {
    // console.warn("Adding CR Summoning", {
    //   this: this,
    //   originName: this.originName,
    //   activity,
    // });
    const summonsData = CR_DATA[this.originName]
      ? {
        summon: {
          prompt: true,
          mode: "cr",
        },
        profiles: CR_DATA[this.originName].profiles,
        creatureTypes: CR_DATA[this.originName].creatureTypes,
        ...(CR_DATA[this.originName].match ? { match: CR_DATA[this.originName].match } : {}),
      }
      : DICTIONARY.companions.FIND_FAMILIAR_MATCHES.includes(this.originName)
        ? await getFindFamiliarActivityData(activity, this.options)
        : null;

    if (!summonsData) return;
    if (!this.originDocument) {
      logger.warn(`No origin document for ${this.originName}, unable to add CR summoning`);
      return;
    }
    // mergeObject replaces arrays, so a creature type restriction the enricher already stated
    // (Wild Companion's familiar is fey only) would be lost to the generic familiar options
    const ownCreatureTypes = activity.creatureTypes?.length ? [...activity.creatureTypes] : null;
    const activityData = foundry.utils.mergeObject(activity, summonsData);
    if (ownCreatureTypes) activityData.creatureTypes = ownCreatureTypes;
    // console.warn("Final summons Activity Data", foundry.utils.deepClone(activityData));
    if ("activities" in this.originDocument.system) {
      delete this.originDocument.system.activities[activity._id];
      this.originDocument.system.activities[activity._id] = activityData;
    }
  }

}
