import { logger } from "../../lib/_module.mjs";
import { SETTINGS } from "../../config/_module.mjs";
import DDBMonster from "../DDBMonster.js";
import { DDBReferenceLinker } from "../lib/_module.mjs";

// extracts various attacks and features (not spells)
// generates and extra descriptions found in these fields
// feature parsing is handled in a separate class, the DDBFeatureFactory
// that class breaks down the html into possible actions which it passes to the
// DDBFeature class which tries to parse the feature for details
DDBMonster.prototype._generateFeatures = async function () {

  await this.featureFactory.generateActions(this.source.actionsDescription, "action");

  if (this.source.hasLair && this.source.lairDescription != "") {
    await this.featureFactory.generateActions(this.source.lairDescription, "lair");
    this.npc.system.resources["lair"] = this.featureFactory.resources["lair"];
  }

  if (this.source.legendaryActionsDescription != "") {
    await this.featureFactory.generateActions(this.source.legendaryActionsDescription, "legendary");
    this.npc.system.resources["legact"] = this.featureFactory.resources["legendary"];
    if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-set-legendary-resource-bar")) {
      this.npc.prototypeToken.bar2 = { attribute: "resources.legact" };
    }
  }

  if (this.source.specialTraitsDescription != "") {
    await this.featureFactory.generateActions(this.source.specialTraitsDescription, "special");
    this.npc.system.resources["legres"] = this.featureFactory.resources["resistance"];
  }

  await this.featureFactory.generateActions(this.source.reactionsDescription, "reaction");
  await this.featureFactory.generateActions(this.source.bonusActionsDescription, "bonus");
  await this.featureFactory.generateActions(this.source.mythicActionsDescription, "mythic");
  // special MCDM actions
  await this.featureFactory.generateActions(`${this.featureFactory.html.villain}`, "villain");

  this.items.push(
    ...this.featureFactory.actions,
    ...this.featureFactory.lair,
    ...this.featureFactory.legendary,
    ...this.featureFactory.special,
    ...this.featureFactory.reactions,
    ...this.featureFactory.bonus,
    ...this.featureFactory.mythic,
    ...this.featureFactory.villain,
  );

  this.items.forEach((item, i) => {
    if (!item.sort) item.sort = i;
  });

  // add any actor descriptions found in action blocks into the biography
  if (this.featureFactory.characterDescription.unexpected) {
    logger.warn(`Unexpected description for ${this.source.name}`, { description: this.featureFactory.characterDescription });
  }
  this.characterDescription += this.featureFactory.characterDescription.action;
  this.characterDescription += this.featureFactory.characterDescription.reaction;
  this.characterDescription += this.featureFactory.characterDescription.special;
  this.npc.system.details.biography.value += this.characterDescription;

  this.npc.system.details.biography.value = DDBReferenceLinker.replaceMonsterALinks(this.npc.system.details.biography.value, this.npc);
  this.npc.system.details.biography.value = await DDBReferenceLinker.replaceMonsterNameBadLinks(this.npc.system.details.biography.value, this.npc);
};
