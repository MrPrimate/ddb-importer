import {
  utils,
  logger,
  DDBCompendiumFolders,
  DDBItemImporter,
} from "../../lib/_module";
import DDBMonsterImporter from "../../muncher/DDBMonsterImporter";

const JB2A_LICENSE = `<p>The assets in this actor are kindly provided by JB2A and are licensed by <a href="https://creativecommons.org/licenses/by-nc-sa/4.0">Attribution-NonCommercial-ShareAlike 4.0 International</a>.</p>
<p>Check them out at <a href="https://jb2a.com">https://jb2a.com</a> they have a free and patreon supported Foundry module providing wonderful animations and assets for a variety of situations.</p>
<p>You can learn more about their Foundry modules <a href="https://jb2a.com/home/install-instructions/">here</a>.</p>`;

const SUMMONS_INDEX_KEYS = [
  "name",
  "flags.ddbimporter.compendiumId",
  "flags.ddbimporter.id",
  "flags.ddbimporter.summons",
];

interface ISummonsIndexMock {
  name: string;
  uuid: string;
  _id: string;
  flags: {
    ddbimporter: {
      compendiumId: string;
      id: string;
      summons: {
        summonsKey: string;
        version: number;
        folder: string;
      };
    };
  };
}

export default class DDBSummonsManager {

  static DEFAULT_SUMMON: I5eSummonActivity = {
    match: {
      proficiency: false,
      attacks: false,
      saves: false,
    },
    bonuses: {
      ac: "",
      hp: "",
      attackDamage: "",
      saveDamage: "",
      healing: "",
    },
    profiles: [],
    creatureSizes: [],
    creatureTypes: [],
    summon: {
      prompt: true,
      mode: "",
    },
  };

  itemHandler: DDBItemImporter<I5eMonsterData> | null;
  ddbData: IDDBData | null;
  notifier: NotifierV1 | null;
  indexFilter: { fields: string[] };
  // created in init(), which callers run before any use
  compendiumFolders!: DDBCompendiumFolders;

  constructor({ ddbData = null, notifier = null }: {
    ddbData?: IDDBData | null;
    notifier?: NotifierV1 | null;
  } = {}) {
    this.ddbData = ddbData;
    this.indexFilter = { fields: SUMMONS_INDEX_KEYS };
    this.itemHandler = null;
    this.notifier = notifier;
  }

  async init() {
    this.compendiumFolders = new DDBCompendiumFolders("summons");
    await this.compendiumFolders.loadCompendium("summons");

    this.itemHandler = new DDBItemImporter<I5eMonsterData>("summons", [], {
      indexFilter: this.indexFilter,
      matchFlags: ["is2014", "is2024"],
      notifier: this.notifier,
    });
    await this.itemHandler.init();
  }

  async addToCompendium(companion: I5eMonsterData, updateExisting: boolean | null = null): Promise<Actor.Implementation[]> {
    const results: Actor.Implementation[] = [];
    if (!game.user.isGM) return results;
    const compendiumCompanion = foundry.utils.deepClone(companion);
    delete compendiumCompanion.folder;
    const folder = await this.compendiumFolders.createSummonsFolder(compendiumCompanion);
    compendiumCompanion.folder = folder._id;

    const npc = await DDBMonsterImporter.addNPC(compendiumCompanion, "summons", {
      forceImageUpdate: true,
    }, { updateExisting });
    if (npc) {
      results.push(npc);
    } else {
      logger.warn(`Companion ${compendiumCompanion.name} was not added to the compendium`);
    }
    return results;
  }

  addProfilesToActivity(activity: I5eSummonActivity, summonsKeys: IDDBSummonProfileKey[] = [], data = {}) {

    const keys = summonsKeys.map((s: any) => s.name);

    const compendium = this.itemHandler?.compendium;
    if (!compendium) {
      logger.warn("Summons manager not initialised, unable to add profiles to activity");
      return activity;
    }

    const summonActors = compendium.index.filter((i) =>
      keys.includes(foundry.utils.getProperty(i, "flags.ddbimporter.summons.summonsKey") as string),
    ) as unknown as ISummonsIndexMock[];
    const profiles: I5eSummonProfile[] = summonActors
      .map((actor) => {
        const flag = foundry.utils.getProperty(actor, "flags.ddbimporter.summons.summonsKey") as string;
        const summonKeyCount = summonsKeys.find((s) => flag === s.name)?.count ?? "";
        const summonKeyLevel = summonsKeys.find((s) => flag === s.name)?.level ?? { min: null, max: null };
        return {
          _id: actor._id,
          name: actor.name,
          uuid: actor.uuid,
          count: String(summonKeyCount),
          level: summonKeyLevel,
        };
      });

    const baseData = foundry.utils.mergeObject(
      foundry.utils.deepClone(DDBSummonsManager.DEFAULT_SUMMON), data) as I5eSummonActivity;

    baseData.profiles = profiles;
    activity = foundry.utils.mergeObject(activity, baseData);
    return activity;
  }

  static async addGeneratedSummons(generatedSummonedActors: ICompanionResult, { notifier = null }: { notifier?: NotifierV1 | null } = {}): Promise<void> {
    if (!game.user.isGM) return;
    const manager = new DDBSummonsManager({ notifier });
    await manager.init();
    const itemHandler = manager.itemHandler;
    if (!itemHandler) {
      logger.warn("Summons item handler failed to initialise, unable to add generated summons");
      return;
    }

    for (const [key, value] of Object.entries(generatedSummonedActors)) {
      // check for JB2A modules
      if (value.needsJB2A
        && !game.modules.get("jb2a_patreon")?.active
        && !game.modules.get("JB2A_DnD5e")?.active
      ) continue;
      if (value.needsJB2APatreon && !game.modules.get("jb2a_patreon")?.active) continue;
      const existingSummons = itemHandler.compendium.index.find((i) =>
        foundry.utils.getProperty(i, "flags.ddbimporter.summons.summonsKey") === key,
      ) as unknown as ISummonsIndexMock;

      if (existingSummons && existingSummons.flags.ddbimporter.summons.version >= parseInt(value.version)) continue;

      // set summons data
      const companion = foundry.utils.deepClone(value.data);
      foundry.utils.setProperty(companion, "flags.ddbimporter.summons", {
        summonsKey: key,
        version: value.version,
        folder: value.folderName,
      });
      companion._id = utils.namedIDStub(value.name, { prefix: "ddbSum", postfix: companion.system.source?.rules ?? "" });

      if (value.isJB2A) {
        foundry.utils.setProperty(companion, "system.details.biography", {
          value: JB2A_LICENSE,
          public: JB2A_LICENSE,
        });
      }

      logger.debug(`Creating ${key}`, companion);

      await manager.addToCompendium(companion);
    }
  }

}
