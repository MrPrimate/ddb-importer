import SETTINGS from "../../settings.js";
import DDBCharacter from "../DDBCharacter.js";
import DDBCompanionFactory from "./DDBCompanionFactory.js";

DDBCharacter.prototype.getClassFeature = function getClassFeature(name) {
  const klass = this.source.ddb.character.classes
    .find((k) => k.classFeatures.some((f) => f.definition.name == name));
  return klass?.classFeatures?.find((f) => f.definition.name == name);
};

DDBCharacter.prototype._getCompanionFeature = async function _getCompanionFeature(featureName) {
  const feature = this.getClassFeature(featureName);
  if (!feature) return undefined;
  const ddbCompanionFactory = new DDBCompanionFactory(this, feature.definition.description, {});
  await ddbCompanionFactory.parse();
  return ddbCompanionFactory.companions;
};

DDBCharacter.prototype.generateCompanions = async function generateCompanions() {
  if (!game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-create-companions")) return;
  const steelDefender = await this._getCompanionFeature("Steel Defender");
  const infusions = await this._getCompanionFeature("Artificer Infusions");

  const companions = [
    steelDefender,
    infusions
  ];


  this.companions = await Promise.all(companions);

  console.warn("parsed companions", this.companions);
  // different types of companion
  // ranger beast companions, classic and new
  // ranger drake warden
  // ranger other?
  // artificer steel defender
  // artificer homunculus
  // new summon spells
  // classic summons (not handled here)
  // druid circle of fire companion


};

