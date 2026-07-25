import { logger } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";
import { SystemHelpers } from "../lib/_module";
// import { fixCharacterLevels } from "./filterModifiers";

DDBCharacter.prototype._newPCSkeleton = async function _newPCSkeleton(this: DDBCharacter): Promise<I5ePCData> {
  const ddb = this.source?.ddb;
  if (!ddb) {
    // matches the previous behaviour of throwing when no source data has been fetched
    throw new Error("Unable to build character skeleton, no DDB source data");
  }
  const name = (ddb.character.name === "") ? "Hero With No Name" : ddb.character.name;

  this.raw.character = {
    system: SystemHelpers.getTemplate("character"),
    type: "character",
    effects: [],
    name: name,
    // items: [],  // modified to check inventory analysis on update
    flags: {
      ddbimporter: {
        compendium: false,
        acEffects: [],
        baseAC: 10,
        dndbeyond: {
          totalLevels: null,
          proficiencies: null,
          proficienciesIncludingEffects: null,
          roUrl: ddb.character.readonlyUrl,
          characterValues: ddb.character.characterValues,
          templateStrings: [],
          campaign: ddb.character.campaign,
        },
      },
    },
  };

  // generate a prototype token
  this._generateToken();

  return this.raw.character;
};

DDBCharacter.prototype._generateCharacter = async function _generateCharacter(this: DDBCharacter) {
  // *************************************
  // PARSING THE CHARACTER
  // **************************************
  //
  // ddb = fixCharacterLevels(ddb);

  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("Unable to generate character, no DDB source data");
    return;
  }

  // build skeleton this.raw.character
  await this._newPCSkeleton();

  const dndbeyondFlags = this.raw.character.flags?.ddbimporter?.dndbeyond;
  const attributes = this.raw.character.system.attributes;
  const details = this.raw.character.system.details;
  if (!dndbeyondFlags || !attributes || !details?.xp) {
    logger.warn("Unable to generate character, skeleton is missing expected data", { character: this.raw.character });
    return;
  }

  this.totalLevels = ddb.character.classes.reduce((prev, cur) => prev + cur.level, 0);
  dndbeyondFlags.totalLevels = this.totalLevels;
  // prettier-ignore
  this.profBonus = Math.ceil(1 + (0.25 * this.totalLevels));
  dndbeyondFlags.profBonus = this.profBonus;
  this._generateProficiencies();

  // Get supported 5e feats and abilities
  // We do this first so we can check for them later
  this._setSpecialTraitFlags();

  this._generateAbilities();
  this._generateDeathSaves();
  this._generateExhaustion();
  attributes.inspiration = ddb.character.inspiration;
  this._generateArmorClass();
  this._generateHitPoints();
  this._generateInitiative();
  this._generateSpeed();
  this._generateSenses();
  this._generateSpellCasting();
  // resources
  this._generateResources();
  this._generateMaxPreparedSpells();
  details.xp.value = ddb.character.currentXp;
  this._generateTrait();
  this._generateIdeal();
  this._generateFlaw();
  this._generateBond();
  this._generateAppearance();
  this._generateDescription();
  this._generateAlignment();
  this._generateBiography();
  this._generateSize();
  // immunities, resistances, vuls and condition immunities
  this._generateConditions();
  this._generateCurrency();
  await this._generateSkills();
  this._generateSpellSlots();

  // Extra global bonuses
  this._generateBonusAbilities();
  this._generateBonusSpellAttacks();
  this._generateBonusSpellDC();
  this._generateBonusWeaponAttacks();
};
