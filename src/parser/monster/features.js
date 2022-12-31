import logger from "../../logger.js";
import SETTINGS from "../../settings.js";
import DDBMonster from "../DDBMonster.js";

// extracts various attacks and features (not spells)
// generates and extra descriptions found in these fields
// feature parsing is handled in a separate class, the DDBFeatureFactory
// that class breaks down the html into possible actions which it passes to the
// DDBFeature class which tries to parse the feature for details
DDBMonster.prototype._generateFeatures = function () {

  this.featureFactory.generateActions(this.source.actionsDescription, "action");

  if (this.source.hasLair && this.source.lairDescription != "") {
    this.featureFactory.generateActions(this.source.lairDescription, "lair");
    this.npc.system.resources["lair"] = this.featureFactory.resources["lair"];
  }

  if (this.source.legendaryActionsDescription != "") {
    this.featureFactory.generateActions(this.source.legendaryActionsDescription, "legendary");
    this.npc.system.resources["legact"] = this.featureFactory.resources["legendary"];
    if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-set-legendary-resource-bar")) {
      this.npc.prototypeToken.bar2 = { attribute: "resources.legact" };
    }
  }

  if (this.source.specialTraitsDescription != "") {
    this.featureFactory.generateActions(this.source.specialTraitsDescription, "special");
    this.npc.system.resources["legres"] = this.featureFactory.resources["resistance"];
  }

  this.featureFactory.generateActions(this.source.reactionsDescription, "reaction");
  this.featureFactory.generateActions(this.source.bonusActionsDescription, "bonus");
  this.featureFactory.generateActions(this.source.mythicActionsDescription, "mythic");

  this.items.push(
    ...this.featureFactory.actions,
    ...this.featureFactory.lair,
    ...this.featureFactory.legendary,
    ...this.featureFactory.special,
    ...this.featureFactory.reactions,
    ...this.featureFactory.bonus,
    ...this.featureFactory.mythic,
  );

  // add any actor descriptions found in action blocks into the biography
  if (this.featureFactory.characterDescription.unexpected) {
    logger.warn(`Unexpected description for ${this.source.name}`, { description: this.featureFactory.characterDescription });
  }
  this.characterDescription += this.characterDescriptionAction;
  this.characterDescription += this.featureFactory.characterDescription.reaction;
  if (this.specialTraits?.characterDescription) {
    this.characterDescription += this.specialTraits.characterDescription;
  }
  this.npc.system.details.biography.value += this.characterDescription;
};
