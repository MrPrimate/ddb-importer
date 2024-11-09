/* eslint-disable no-continue */
/* eslint-disable require-atomic-updates */

import PatreonHelper from "../../lib/PatreonHelper.js";
import { logger } from "../../lib/_module.mjs";
import SETTINGS from "../../settings.js";
import ChrisPremadesHelper from "./ChrisPremadesHelper.js";

export default class ExternalAutomations {

  constructor(actor) {
    this.actor = actor;
    const dynamicSync = game.settings.get("ddb-importer", "dynamic-sync");
    const updateUser = game.settings.get("ddb-importer", "dynamic-sync-user");
    const gmSyncUser = game.user.isGM && game.user.id == updateUser;
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);
    this.dynamicUpdateAllowed = dynamicSync && gmSyncUser && tiers?.experimentalMid;
    this.dynamicUpdateStatus = this.actor.flags?.ddbimporter?.activeUpdate;
  }

  getCurrentDynamicUpdateState() {
    return this.actor.flags?.ddbimporter?.activeUpdate ?? false;
  }

  async disableDynamicUpdates() {
    if (!this.dynamicUpdateStatus) return;
    const activeUpdateData = { flags: { ddbimporter: { activeUpdate: false } } };
    await this.actor.update(activeUpdateData);
  }

  async enableDynamicUpdates() {
    if (!this.dynamicUpdateStatus) return;
    const activeUpdateData = { flags: { ddbimporter: { activeUpdate: true } } };
    await this.actor.update(activeUpdateData);
  }

  static async applyChrisPremadeEffect({ document, type, isMonster = false, folderName = null, chrisNameOverride = null } = {}) {
    return ChrisPremadesHelper.findAndUpdate({
      document,
      type,
      folderName,
      chrisNameOverride,
      isMonster,
    });
  }

  static async applyChrisPremadeEffects({ documents, compendiumItem = false, force = false, isMonster = false, folderName = null } = {}) {
    if (!game.modules.get("chris-premades")?.active) {
      logger.debug("Chris Premades not active");
      return documents;
    }

    const applyChrisEffects = force || (compendiumItem
      ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-chris-premades")
      : game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-chris-premades"));
    if (!applyChrisEffects) {
      logger.debug("Not Applying basic premades");
      return documents;
    }

    for (let doc of documents) {
      if (["class", "subclass", "background"].includes(doc.type)) continue;
      const type = ChrisPremadesHelper.getTypeMatch(doc, isMonster);
      logger.debug(`Evaluating ${doc.name} of type ${type} for Chris's Premade application.`, { type, folderName, isMonster });

      doc = await ChrisPremadesHelper.findAndUpdate({
        document: doc,
        type,
        folderName,
        isMonster,
      });
      if (isMonster && !["monsterfeature"].includes(type) && !foundry.utils.getProperty(doc, "flags.ddbimporter.effectsApplied") === true) {
        logger.debug(`No Chris' Premade found for ${doc.name} with type "${type}", checking for monster feature.`);
        doc = await ChrisPremadesHelper.findAndUpdate({ document: doc, type: "monsterfeature", folderName, isMonster });
      }
    }

    return documents;
  }

  static async addChrisEffectsToActorDocuments(actor) {
    if (!game.modules.get("chris-premades")?.active) {
      ui.notifications.error("Chris Premades module not installed");
      return [];
    }

    const externalAutomations = new ExternalAutomations(actor);
    await externalAutomations.disableDynamicUpdates();

    logger.info("Starting to update actor documents with Chris Premades effects");
    let documents = actor.getEmbeddedCollection("Item").toObject();
    const isMonster = actor.type === "npc";
    const folderName = isMonster ? actor.name : null;
    const data = (await ExternalAutomations.applyChrisPremadeEffects({
      documents,
      compendiumItem: false,
      force: true,
      folderName,
      isMonster,
    }))
      .filter((d) =>
        foundry.utils.getProperty(d, "flags.ddbimporter.chrisEffectsApplied") === true
        && !foundry.utils.hasProperty(d, "flags.items-with-spells-5e.item-spells.parent-item"),
      );
    const dataIds = data.map((d) => d._id);
    logger.debug("Chris premades generation complete, beginning replace", {
      isMonster,
      folderName,
      data,
      dataIds,
      actor,
      documents,
    });
    await actor.deleteEmbeddedDocuments("Item", dataIds);
    logger.debug("Chris premades, deletion complete");
    logger.debug("Creating chris premade items", data);
    await actor.createEmbeddedDocuments("Item", data, { keepId: true });
    logger.debug("Delete and recreate complete, beginning restricted item replacer");
    await ChrisPremadesHelper.restrictedItemReplacer(actor, folderName);
    logger.debug("Restricted item replacer complete, beginning Replacement of Redundant Chris Documents");
    await ChrisPremadesHelper.addAndReplaceRedundantChrisDocuments(actor);
    logger.info("Effect replacement complete");
    await externalAutomations.enableDynamicUpdates();
    return data.map((d) => d.name);
  }
}
