import utils from "../../lib/utils.js";
import DDBCharacter from "../DDBCharacter.js";
// import { fixCharacterLevels } from "./filterModifiers.js";

DDBCharacter.prototype._newPCSkeleton = async function _newPCSkeleton() {
  const name = (this.source.ddb.character.name === "") ? "Hero With No Name" : this.source.ddb.character.name;

  this.raw.character = {
    system: utils.getTemplate("character"),
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
          roUrl: this.source.ddb.character.readonlyUrl,
          characterValues: this.source.ddb.character.characterValues,
          templateStrings: [],
          campaign: this.source.ddb.character.campaign,
        },
      },
    },
  };

  // generate a prototype token
  this._generateToken();

  return this.raw.character;
};

DDBCharacter.prototype._generateCharacter = async function _generateCharacter() {
  // *************************************
  // PARSING THE CHARACTER
  // **************************************
  //
  // ddb = fixCharacterLevels(ddb);

  // build skeleton this.raw.character
  await this._newPCSkeleton();

  this.totalLevels = this.source.ddb.character.classes.reduce((prev, cur) => prev + cur.level, 0);
  this.raw.character.flags.ddbimporter.dndbeyond.totalLevels = this.totalLevels;
  // prettier-ignore
  this.profBonus = Math.ceil(1 + (0.25 * this.totalLevels));
  this.raw.character.flags.ddbimporter.dndbeyond.profBonus = this.profBonus;
  this._generateProficiencies();

  // proficiency
  this.raw.character.system.attributes.prof = this.profBonus;

  // Get supported 5e feats and abilities
  // We do this first so we can check for them later
  this._setSpecialTraitFlags();

  this._generateAbilities();
  this._generateHitDice();
  this._generateDeathSaves();
  this._generateExhaustion();
  this.raw.character.system.attributes.inspiration = this.source.ddb.character.inspiration;
  this._generateArmorClass();
  this._generateHitPoints();
  this._generateInitiative();
  this._generateSpeed();
  this._generateSenses();
  this._generateSpellCasting();
  this._generateSpellDC();
  // resources
  this._generateResources();
  this._generateMaxPreparedSpells();
  this.raw.character.system.details.xp.value = this.source.ddb.character.currentXp;
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

