import logger from "../../logger.js";
import DDBCharacter from "../DDBCharacter.js";
import DDBCompanionFactory from "./DDBCompanionFactory.js";

// DDBCharacter.prototype.addCompanionsToDocument = function(document, companions) {
//   return document;
// };

DDBCharacter.prototype.getClassFeature = function(name) {
  const klass = this.source.ddb.character.classes
    .find((k) => k.classFeatures.some((f) => f.definition.name == name));
  return klass?.classFeatures?.find((f) => f.definition.name == name);
};


DDBCharacter.prototype._findDDBSpell = function(name) {
  const spells = [];
  this.source.ddb.character.classSpells.forEach((playerClass) => {
    spells.push(...playerClass.spells);
  });

  const klassSpell = spells.find((s) => s.definition?.name === name);
  if (klassSpell) return klassSpell;

  // Parse any spells granted by class features, such as Barbarian Totem
  const extraKlass = this.source.ddb.character.spells.class.find((s) => s.definition?.name === name);
  if (extraKlass) return extraKlass;

  // Race spells are handled slightly differently
  const race = this.source.ddb.character.spells.race.find((s) => s.definition?.name === name);
  if (race) return race;

  // feat spells are handled slightly differently
  const feat = this.source.ddb.character.spells.feat.find((s) => s.definition?.name === name);
  if (feat) return feat;

  // background spells are handled slightly differently
  if (!this.source.ddbdb.character.spells.background) this.source.ddb.character.spells.background = [];
  const background = this.source.ddb.character.spells.background.find((s) => s.definition?.name === name);
  if (background) return background;

  return undefined;
};

DDBCharacter.prototype._getCompanionSpell = async function(name) {
  // console.warn(`Check data for spell ${name}`);
  const spell = this.data.spells.find((s) => s.name === name || s.flags.ddbimporter?.originalName === name);
  if (!spell) return [];

  const ddbSpell = this._findDDBSpell(spell.flags.ddbimporter?.originalName ?? spell.name);
  if (!ddbSpell) return [];

  // console.warn(`Companion parse for ${name}`, { spell, ddbSpell });
  const ddbCompanionFactory = new DDBCompanionFactory(this, ddbSpell.definition.description, { type: "spell" });
  await ddbCompanionFactory.parse();
  return ddbCompanionFactory.companions;
};

DDBCharacter.prototype._getCompanionFeature = async function(featureName) {
  const feature = this.data.features.concat(this.data.actions).find((s) =>
    s.name === featureName || s.flags.ddbimporter?.originalName === featureName
  );
  if (!feature) return [];
  const ddbFeature = this.getClassFeature(featureName);
  if (!ddbFeature) return [];
  const ddbCompanionFactory = new DDBCompanionFactory(this, ddbFeature.definition.description, { type: "feature" });
  await ddbCompanionFactory.parse();
  return ddbCompanionFactory.companions;
};

DDBCharacter.prototype.generateCompanions = async function() {
  if (!game.modules.get("arbron-summoner")?.active) {
    logger.warn("Companion Parsing requires the Arbron Summoner module");
    return;
  }
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
  const draconic = await this._getCompanionSpell("Summon Draconic Spirit");

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
    ...draconic,
  ];

  this.companions = await Promise.all(companions);

  logger.debug("parsed companions", this.companions);
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

