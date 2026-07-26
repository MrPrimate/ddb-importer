import { logger, utils } from "../../lib/_module";
import DDBMonster from "../DDBMonster";
import { DDBReferenceLinker } from "../lib/_module";

// extracts various attacks and features (not spells)
// generates and extra descriptions found in these fields
// feature parsing is handled in a separate class, the DDBFeatureFactory
// that class breaks down the html into possible actions which it passes to the
// DDBFeature class which tries to parse the feature for details
DDBMonster.prototype._generateFeatures = async function (this: DDBMonster) {

  const resources = this.npc.system.resources;
  const biography = this.npc.system.details?.biography;
  const prototypeToken = this.npc.prototypeToken;
  if (!resources || !biography || !prototypeToken) {
    logger.warn(`_generateFeatures: missing npc resources, biography or prototype token for ${this.source.name}`);
    return;
  }

  await this.featureFactory.generateActions(this.source.actionsDescription, "action");

  if (this.source.hasLair && this.source.lairDescription != "") {
    await this.featureFactory.generateActions(this.source.lairDescription, "lair");
    resources["lair"] = this.featureFactory.resources["lair"];
  }

  if (this.source.legendaryActionsDescription != "") {
    await this.featureFactory.generateActions(this.source.legendaryActionsDescription, "legendary");
    resources["legact"] = this.featureFactory.resources["legendary"];
    if (utils.getSetting<boolean>("munching-policy-monster-set-legendary-resource-bar")) {
      prototypeToken.bar2 = { attribute: "resources.legact" };
    }
  }

  if (this.source.specialTraitsDescription != "") {
    await this.featureFactory.generateActions(this.source.specialTraitsDescription, "special");
    resources["legres"] = this.featureFactory.resources["resistance"];
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
  biography.value += this.characterDescription;

  biography.value = DDBReferenceLinker.replaceMonsterALinks(biography.value, this.npc);
  biography.value = await DDBReferenceLinker.replaceMonsterNameBadLinks(biography.value, this.npc);
};
