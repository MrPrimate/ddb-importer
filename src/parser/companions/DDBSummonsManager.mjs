import {
  utils,
  logger,
  DDBCompendiumFolders,
  DDBItemImporter,
} from "../../lib/_module.mjs";
import DDBMonsterImporter from "../../muncher/DDBMonsterImporter.mjs";

const JB2A_LICENSE = `<p>The assets in this actor are kindly provided by JB2A and are licensed by <a href="https://creativecommons.org/licenses/by-nc-sa/4.0">Attribution-NonCommercial-ShareAlike 4.0 International</a>.</p>
<p>Check them out at <a href="https://jb2a.com">https://jb2a.com</a> they have a free and patreon supported Foundry module providing wonderful animations and assets for a variety of situations.</p>
<p>You can learn more about their Foundry modules <a href="https://jb2a.com/home/install-instructions/">here</a>.</p>`;


export default class DDBSummonsManager {

  static DEFAULT_SUMMON = {
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

  constructor({ ddbData, notifier = null } = {}) {
    this.ddbData = ddbData;
    this.indexFilter = { fields: [
      "name",
      "flags.ddbimporter.compendiumId",
      "flags.ddbimporter.id",
      "flags.ddbimporter.summons",
    ] };
    this.itemHandler = null;
    this.notifier = notifier;
  }

  async init() {
    this.compendiumFolders = new DDBCompendiumFolders("summons");
    await this.compendiumFolders.loadCompendium("summons");

    this.itemHandler = new DDBItemImporter("summons", [], {
      indexFilter: this.indexFilter,
      matchFlags: ["is2014", "is2024"],
      notifier: this.notifier,
    });
    await this.itemHandler.init();
  }

  async addToCompendium(companion, updateExisting = null) {
    const results = [];
    if (!game.user.isGM) return results;
    const compendiumCompanion = foundry.utils.deepClone(companion);
    delete compendiumCompanion.folder;
    const folder = await this.compendiumFolders.createSummonsFolder(compendiumCompanion);
    compendiumCompanion.folder = folder._id;

    const npc = await DDBMonsterImporter.addNPC(compendiumCompanion, "summons", {
      forceImageUpdate: true,
    }, { updateExisting });
    results.push(npc);
    return results;
  }

  addProfilesToActivity(activity, summonsKeys = [], data = {}) {

    const keys = summonsKeys.map((s) => s.name);

    const summonActors = this.itemHandler.compendium.index.filter((i) =>
      keys.includes(i.flags?.ddbimporter?.summons?.summonsKey),
    );
    const profiles = summonActors
      .map((actor) => {
        const flag = actor.flags.ddbimporter.summons.summonsKey;
        return {
          _id: actor._id,
          name: actor.name,
          uuid: actor.uuid,
          count: summonsKeys.find((s) => flag === s.name)?.count ?? "",
          level: summonsKeys.find((s) => flag === s.name)?.level ?? { min: null, max: null },
        };
      });

    const baseData = foundry.utils.mergeObject(
      foundry.utils.deepClone(DDBSummonsManager.DEFAULT_SUMMON), data);

    baseData.profiles = profiles;
    activity = foundry.utils.mergeObject(activity, baseData);

  }

  static async addGeneratedSummons(generatedSummonedActors, { notifier = null } = {}) {
    if (!game.user.isGM) return;
    const manager = new DDBSummonsManager({ notifier });
    await manager.init();

    for (const [key, value] of Object.entries(generatedSummonedActors)) {
      // check for JB2A modules
      if (value.needsJB2A
        && !game.modules.get('jb2a_patreon')?.active
        && !game.modules.get('JB2A_DnD5e')?.active
      ) continue;
      if (value.needsJB2APatreon && !game.modules.get('jb2a_patreon')?.active) continue;
      const existingSummons = manager.itemHandler.compendium.index.find((i) =>
        i.flags?.ddbimporter?.summons?.summonsKey === key,
      );

      if (existingSummons && existingSummons.flags.ddbimporter.summons.version >= value.version) continue;

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
