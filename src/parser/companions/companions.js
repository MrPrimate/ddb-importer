import SETTINGS from "../../settings.js";
import DDBCharacter from "../DDBCharacter.js";
import DDBCompanionFactory from "./DDBCompanionFactory.js";

DDBCharacter.prototype.getClassFeature = function getClassFeature(name) {
  const klass = this.source.ddb.character.classes
    .find((k) => k.classFeatures.some((f) => f.definition.name == name));
  return klass?.classFeatures?.find((f) => f.definition.name == name);
};

DDBCharacter.prototype._getCompanionSpell = async function _getCompanionSpell(name) {
  const spell = this.data.spells.find((s) => s.name === name || s.flags.ddbimporter?.originalName === name);
  if (!spell) return [];
  const ddbCompanionFactory = new DDBCompanionFactory(this, spell.system.description.value, {});
  await ddbCompanionFactory.parse();
  return ddbCompanionFactory.companions;
};

// DDBCharacter.prototype._getCompanionFeature = async function _getCompanionFeature(featureName) {
//   const feature = this.getClassFeature(featureName);
//   if (!feature) return [];
//   const ddbCompanionFactory = new DDBCompanionFactory(this, feature.definition.description, {});
//   await ddbCompanionFactory.parse();
//   return ddbCompanionFactory.companions;
// };

DDBCharacter.prototype._getCompanionFeature = async function _getCompanionFeature(featureName) {
  const feature = this.data.features.concat(this.data.actions).find((s) =>
    s.name === featureName || s.flags.ddbimporter?.originalName === featureName
  );
  if (!feature) return [];
  const ddbCompanionFactory = new DDBCompanionFactory(this, feature.system.description.value, {});
  await ddbCompanionFactory.parse();
  return ddbCompanionFactory.companions;
};

DDBCharacter.prototype.generateCompanions = async function generateCompanions() {
  if (!game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-create-companions")) return;
  const steelDefender = await this._getCompanionFeature("Steel Defender");
  const infusions = await this._getCompanionFeature("Artificer Infusions");
  const wildFireSpirit = await this._getCompanionFeature("Summon Wildfire Spirit");
  const primalCompanions = await this._getCompanionFeature("Primal Companion");
  const aberration = await this._getCompanionSpell("Summon Aberration");
  const beast = await this._getCompanionSpell("Summon Beast");
  const celestial = await this._getCompanionSpell("Summon Celestial");
  const construct = await this._getCompanionSpell("Summon Construct");
  const elemental = await this._getCompanionSpell("Summon Elemental");
  const fey = await this._getCompanionSpell("Summon Fey");
  const fiend = await this._getCompanionSpell("Summon Fiend");
  const shadowspawn = await this._getCompanionSpell("Summon Shadowspawn");
  const undead = await this._getCompanionSpell("Summon Undead");


  const companions = [
    ...steelDefender,
    ...infusions,
    ...wildFireSpirit,
    ...primalCompanions,
    ...aberration,
    ...beast,
    ...celestial,
    ...construct,
    ...elemental,
    ...fey,
    ...fiend,
    ...shadowspawn,
    ...undead,
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

