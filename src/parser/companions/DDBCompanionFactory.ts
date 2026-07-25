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

type TDDBOriginDocument = TAll5eItemDocuments;

interface DDBCompanionFactoryOptions {
  originDocument?: TDDBOriginDocument;
  is2014?: boolean;
  is2024?: boolean;
  notifier?: any;
  actor?: TImporterActor | null;
  data?: I5eMonsterData[];
  folderHint?: string;
  createCompanions?: boolean;
  updateCompanions?: boolean;
  updateImages?: boolean;
  noCompendiums?: boolean;
  type?: string;
}

export default class DDBCompanionFactory {
  actor: TImporterActor | null;
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
  notifier: NotifierV1;
  summonsManager: DDBSummonsManager;
  itemHandler: DDBItemImporter<I5eMonsterData> | null;
  companions: (DDBCompanion2014 | DDBCompanion2024)[];
  originName: string;
  summons: I5eSummonActivity | null;

  constructor(html: string, options: DDBCompanionFactoryOptions = {}) {
    const defaultOptions: DDBCompanionFactoryOptions = {
      createCompanions: true,
      updateCompanions: true,
      updateImages: false,
    };
    // console.warn("html", html);
    this.options = Object.assign({}, defaultOptions, options);
    this.html = html;
    this.doc = new DOMParser().parseFromString(html.replaceAll("\n", ""), "text/html");
    this.companions = [];
    this.actor = this.options.actor ?? null;
    this.folderIds = new Set();
    this.createCompanions = this.options.createCompanions ?? true;
    this.updateCompanions = this.options.updateCompanions ?? true; //  game.settings.get("ddb-importer", "munching-policy-update-existing");
    this.updateImages = this.options.updateImages ?? false; // game.settings.get("ddb-importer", "munching-policy-update-images");
    this.results = {
      created: [],
      updated: [],
    };
    this.originDocument = this.options.originDocument ?? null;
    this.originName = (this.originDocument
      ? foundry.utils.getProperty(this.originDocument, "flags.ddbimporter.originalName") as string
        ?? this.originDocument.name
      : undefined)
      ?? "";
    this.is2014 = this.options.is2014 ?? false;
    this.is2024 = !this.options.is2014 || (this.options.is2024 ?? false);
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

  async init() {
    await this.summonsManager.init();
    this.itemHandler = this.summonsManager.itemHandler;
  }

  get data(): I5eMonsterData[] {
    return this.options.data ?? this.companions.map((c) => c.data);
  }

  static MULTI_2014 = DICTIONARY.companions.MULTI_COMPANIONS_2014;

  static MULTI_2024 = DICTIONARY.companions.MULTI_COMPANIONS_2024;

  async #buildCompanion(block: HTMLElement, options: IDDBCompanionMixinOptions = {}) {
    logger.debug("Beginning companion parse", { block });
    const finalOverrides: IDDBCompanionMixinOptions = {
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

    }
  }

  async _parse2014() {

    await this.init();

    // console.warn(this.doc);
    const statBlockDivs = this.doc.querySelectorAll("div.stat-block-background, div.stat-block-finder, div.basic-text-frame");

    // console.warn("statblkc divs", { statBlockDivs, athis: this });
    for (const block of statBlockDivs) {
      const name = (block
        .querySelector("p.Stat-Block-Styles_Stat-Block-Title")
        ?.textContent ?? "")
        .trim()
        .toLowerCase()
        .split(/\s/)
        .map((w) => utils.capitalize(w.trim()))
        .join(" ");

      // console.warn("Processing Companion", { name, block });
      if (name && name in DDBCompanionFactory.MULTI_2014) {
        for (const subType of DDBCompanionFactory.MULTI_2014[name]) {
          await this.#buildCompanion(block as HTMLElement, { name, subType });
        }
      } else {
        await this.#buildCompanion(block as HTMLElement, { name, subType: undefined });
      }

    }

    return this.data;
  }

  async _parse2024() {

    await this.init();

    // console.warn(this.doc);
    const statBlockDivs = this.doc.querySelectorAll("div.stat-block");

    for (const block of statBlockDivs) {
      const name = (block
        .querySelector("h4.compendium-hr, h5.compendium-hr, h4")
        ?.textContent ?? "")
        .trim()
        .toLowerCase()
        .split(/\s/)
        .map((w) => utils.capitalize(w.trim()))
        .join(" ");

      if (name && name in DDBCompanionFactory.MULTI_2024) {
        for (const subType of DDBCompanionFactory.MULTI_2024[name]) {
          await this.#buildCompanion(block as HTMLElement, { name, subType });
        }
      } else {
        await this.#buildCompanion(block as HTMLElement, { name, subType: undefined });
      }

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
      if (folder._id) this.folderIds.add(folder._id);
    }
  }

  async getExistingCompendiumCompanions(): Promise<Actor.Implementation[]> {
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

    const existingCompanions: Actor.Implementation[] = await Promise.all(compendiumIndex
      .filter((companion) => foundry.utils.hasProperty(companion, "flags.ddbimporter.id")
        && this.companions.some((c) => foundry.utils.getProperty(c, "data.flags.ddbimporter.id") === companion.flags.ddbimporter.id),
      )
      .map(async (companion) => itemHandler.compendium.getDocument(companion._id) as Promise<Actor.Implementation>),
    );

    return existingCompanions;
  }

  async getExistingWorldCompanions({ folderOverride = null, rootFolderNameOverride = undefined, limitToFactory = false }: {
    folderOverride?: Folder | null;
    rootFolderNameOverride?: string | undefined;
    limitToFactory?: boolean;
  } = {}) {
    if (game.user.isGM && !this.noCompendiums) return [];
    if (!folderOverride) await this.#generateCompanionFolders(rootFolderNameOverride);

    const companionNames = limitToFactory ? this.data.map((c) => c.name) : [];
    logger.debug("Matched companion names", companionNames);

    const existingCompanions = await game.actors.contents
      .filter((companion) => {
        const folderId = companion.folder?.id;
        if (!folderId) return false;
        return ((!folderOverride && this.folderIds.has(folderId))
          || folderOverride?.id === folderId)
          && (!limitToFactory || (limitToFactory && companionNames.includes(companion.name)));
      })
      .map((companion) => companion);
    return existingCompanions;
  }

  static async addToWorld(companion: I5eMonsterData, update: boolean): Promise<Actor.Implementation[]> {
    const results: Actor.Implementation[] = [];
    if (!game.user.can("ITEM_CREATE")) return results;
    const npcBuilder = new DDBMonsterImporter({ monster: companion, type: "monsters" });
    await npcBuilder.build({
      temporary: false,
      update,
      addToWorld: true,
    });
    const npc = npcBuilder.data;
    if (npc) {
      results.push(npc);
    } else {
      logger.warn(`Companion ${companion.name} did not build an actor, unable to add to world`);
    }
    return results;
  }

  async #updateCompanions(companions: I5eMonsterData[], existingCompanions: Actor.Implementation[]): Promise<Actor.Implementation[]> {
    const updateCompanions = companions.filter((companion: any) =>
      existingCompanions.some(
        (exist: any) =>
          exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
          && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
          && companion.system.source.rules === exist.system.source.rules,
      ));

    const results = [];

    // console.warn("Updating companions", { updateCompanions, existingCompanions, companions });
    for (const companion of updateCompanions) {
      const companionId = companion.flags?.ddbimporter?.id;
      if (!companionId) {
        logger.warn(`Companion ${companion.name} has no ddbimporter id flag, skipping update`);
        continue;
      }
      const existingCompanion = existingCompanions.find((exist: any) =>
        exist.flags?.ddbimporter?.id === companionId
        && companion.flags?.ddbimporter?.entityTypeId === companion.flags?.ddbimporter?.entityTypeId
        && companion.system.source?.rules === exist.system.source.rules,
      );
      if (!existingCompanion) {
        logger.warn(`Unable to find existing companion match for ${companion.name}, skipping update`);
        continue;
      }
      companion.folder = existingCompanion.folder?.id ?? undefined;
      companion._id = existingCompanion._id ?? undefined;
      logger.info(`Updating companion ${companion.name}`);
      DDBItemImporter.copySupportedItemFlags(existingCompanion, companion);
      const npc = !this.noCompendiums
        ? await this.summonsManager.addToCompendium(companion)
        : await DDBCompanionFactory.addToWorld(companion, true);
      results.push(npc);
    }

    return results as unknown as Actor.Implementation[];
  }

  async #createCompanions(companions: I5eMonsterData[], existingCompanions: Actor.Implementation[], folderId?: string) {
    if (!game.user.can("ITEM_CREATE")) {
      ui.notifications.warn(`User is unable to create world items, and cannot create companions`);
      return [];
    }
    const newCompanions = companions.filter((companion: any) =>
      !existingCompanions.some(
        (exist: any) =>
          exist.flags?.ddbimporter?.id === companion.flags.ddbimporter.id
          && companion.flags?.ddbimporter?.entityTypeId === companion.flags.ddbimporter.entityTypeId
          && companion.system.source.rules === exist.system.source.rules,
      ));

    const results = [];
    for (const companion of newCompanions) {
      logger.info(`Creating Companion ${companion.name}`);
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
      : await this.getExistingCompendiumCompanions();

    let companionData = this.data;

    if (!game.user.isGM) {
      itemHandler.documents = companionData;
      return;
    }

    if (!this.updateCompanions || !this.updateImages) {
      if (!this.updateImages) {
        logger.debug("Copying monster images across...");
        companionData = DDBMonsterFactory.copyExistingMonsterImages(companionData, existingCompanions as unknown as I5eMonsterData[]);
      }
    }

    itemHandler.documents = companionData;
    await itemHandler.iconAdditions();
    await itemHandler.generateIconMap();

    if (this.updateCompanions) {
      this.results.updated = await this.#updateCompanions(itemHandler.documents, existingCompanions);
    }
    if (this.createCompanions) {
      this.results.created = await this.#createCompanions(itemHandler.documents, existingCompanions, folderOverride?.id ?? undefined);
    }
  }


  static COMPANION_REMAP: Record<string, string> = {
    "Artificer Infusions": "Infusion: Homunculus Servant",
  };

  #getDocumentActivity(document: TAll5eItemDocuments | null = null): I5eActivity {
    const foundryDocument = (document ?? this.originDocument) as TAll5eItemDocuments;
    if (!("activities" in foundryDocument.system)) return {};
    for (const id of Object.keys(foundryDocument.system.activities)) {
      const activity = foundryDocument.system.activities[id];
      if (activity.type === "summon") return activity;
    }
    const activity = new DDBBasicActivity({ type: "summon", foundryFeature: foundryDocument });
    activity.build();
    return activity.data;
  }

  async addCompanionsToDocuments(otherDocuments: I5ePCItem[], activity: I5eSummonActivity | null = null, _enricherActivity: IDDBActivityData | null = null) {
    if (!this.originDocument || !this.summons) return;
    const compendiumSummons = await this.getExistingCompendiumCompanions() as Actor.Implementation[];
    const summonActors: Actor.Implementation[] = compendiumSummons.length > 0
      ? compendiumSummons
      : await this.getExistingWorldCompanions({ limitToFactory: true });
    const profiles: I5eSummonProfile[] = summonActors
      .map((actor) => {
        return {
          _id: actor._id,
          name: actor.name,
          uuid: actor.uuid,
          count: null,
        } as I5eSummonProfile;
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
    if (!activity?.profiles || activity.profiles.length === 0) {
      summonsData.profiles = profiles;
    } else {
      summonsData.profiles = activity.profiles;
    }

    if (activity) {
      if (activity.creatureTypes && activity.creatureTypes.length > 0) {
        summonsData.creatureTypes = activity.creatureTypes;
      }
      if (activity.creatureSizes && activity.creatureSizes.length > 0) {
        summonsData.creatureSizes = activity.creatureSizes;
      }
      if (activity.bonuses) {
        for (const [key, value] of Object.entries(activity.bonuses)) {
          if (value && value !== "") {
            (summonsData.bonuses as Record<string, any>)[key] = value;
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
    const activityDataId = activityData._id;
    if (activityDataId && "activities" in this.originDocument.system && "activities" in updateDocument.system) {
      delete this.originDocument.system.activities[activityDataId];
      updateDocument.system.activities[activityDataId] = activityData;
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
      }
      : DICTIONARY.companions.FIND_FAMILIAR_MATCHES.includes(this.originName)
        ? await getFindFamiliarActivityData(activity, this.options)
        : null;

    if (!summonsData) return;
    if (!this.originDocument) {
      logger.warn(`No origin document for ${this.originName}, unable to add CR summoning`);
      return;
    }
    const activityData = foundry.utils.mergeObject(activity, summonsData);
    // console.warn("Final summons Activity Data", foundry.utils.deepClone(activityData));
    const activityId = activity._id;
    if (activityId && "activities" in this.originDocument.system) {
      delete this.originDocument.system.activities[activityId];
      this.originDocument.system.activities[activityId] = activityData as unknown as I5eActivity;
    }
  }

}
