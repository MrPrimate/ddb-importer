import { DDBHelper, logger, utils } from "../../../lib/_module.mjs";
import AutoEffects from "./AutoEffects.mjs";
import ChangeHelper from "./ChangeHelper.mjs";
import MidiEffects from "./MidiEffects.mjs";
import { ProficiencyFinder } from "../../lib/_module.mjs";
import { DICTIONARY } from "../../../config/_module.mjs";

export default class EffectGenerator {

  _generateDataStub() {
    this.effect = AutoEffects.BaseEffect(this.document, `${this.label} ${this.labelSuffix}`.trim());
    this.effect.description = this.description;
    foundry.utils.setProperty(this.effect, "flags.ddbimporter.passive", true);
  }

  get label() {
    const labelAdjustment = foundry.utils.getProperty(this.document, "flags.ddbimporter.effectLabelOverride");
    if (labelAdjustment) {
      return labelAdjustment;
    } else if (this.type == "infusion") {
      return `${this.document.name} - Infusion`;
    } else {
      return this.labelOverride ?? `${this.document.name}`;
    }
  }

  constructor({
    ddb, character, ddbItem, document, isCompendiumItem, labelOverride, labelSuffix = "", type, description = "",
  } = {}) {
    this.ddb = ddb;
    this.type = type;
    this.character = character;
    this.ddbItem = ddbItem;
    this.document = document;
    this.isCompendiumItem = isCompendiumItem;
    this.labelOverride = labelOverride;
    this.labelSuffix = labelSuffix;
    this.description = description;

    if (!this.document.effects) {
      this.document.effects = [];
    }

    this.proficiencyFinder = new ProficiencyFinder({ ddb });
    this.grantedModifiers = ddbItem.definition?.grantedModifiers;

    if (this.grantedModifiers && type === "item") {
      this.grantedModifiers = this.grantedModifiers.filter((modifier) =>
        modifier.type !== "damage" && modifier.subType !== null,
      );
    }

    this.noGenerate = !this.grantedModifiers || this.grantedModifiers.length === 0;

    this._generateDataStub();
  }


  _addAddBonusChanges(modifiers, type, key) {
    // const bonus = DDBHelper.filterModifiersOld(modifiers, "bonus", type).reduce((a, b) => a + b.value, 0);
    const bonus = DDBHelper.getValueFromModifiers(modifiers, this.document.name, type, "bonus");
    if (bonus) {
      logger.debug(`Generating ${type} bonus for ${this.document.name}`, bonus);
      this.effect.changes.push(ChangeHelper.unsignedAddChange(`+ ${bonus}`, 18, key));
    }
  }

  _addCustomChange(modifiers, type, key, extra = "") {
    const bonus = DDBHelper.filterModifiersOld(modifiers, "bonus", type).reduce((a, b) => a + b.value, 0);
    if (bonus !== 0) {
      logger.debug(`Generating ${type} bonus for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.customChange(`${bonus}${(extra) ? extra : ""}`, 18, key));
    }
  }

  _addLanguages() {
    const languages = this.proficiencyFinder.getLanguagesFromModifiers(this.grantedModifiers);

    languages.value.forEach((prof) => {
      logger.debug(`Generating language ${prof} for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.unsignedAddChange(prof, 0, "system.traits.languages.value"));
    });
    if (languages?.custom != "") {
      logger.debug(`Generating language ${languages.custom} for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.unsignedAddChange(languages.custom, 0, "system.traits.languages.custom"));
    }
  }

  _addGlobalSavingBonusEffect() {
    const type = "saving-throws";
    const key = "system.bonuses.abilities.save";
    let changes = [];
    const regularBonuses = this.grantedModifiers.filter((mod) => !mod.bonusTypes?.includes(2));
    const customBonuses = this.grantedModifiers.filter((mod) => mod.bonusTypes?.includes(2));

    if (customBonuses.length > 0) {
      this._addAddBonusChanges(customBonuses, type, key);
    }

    const regularModifiers = DDBHelper.filterModifiersOld(regularBonuses, "bonus", type);

    if (regularModifiers.length > 0) {
      logger.debug(`Generating ${type} bonus for ${this.document.name}`);
      let bonuses = "";
      regularModifiers.forEach((modifier) => {
        let bonusParse = DDBHelper.extractModifierValue(modifier);
        if (bonuses !== "") bonuses += " + ";
        bonuses += bonusParse;
      });
      if (bonuses === "") bonuses = 0;
      changes.push(ChangeHelper.unsignedAddChange(`+ ${bonuses}`, 20, key));
      logger.debug(`Changes for ${type} bonus for ${this.document.name}`, changes);
    }

    this.effect.changes.push(...changes);

  }

  _getGenericConditionAffectData(condition, typeId, forceNoMidi = false) {
    return AutoEffects.getGenericConditionAffectData(this.grantedModifiers, condition, typeId, forceNoMidi);
  }

  _addDamageConditions() {

    const damageImmunityData = this._getGenericConditionAffectData("immunity", 2);
    const damageResistanceData = this._getGenericConditionAffectData("resistance", 1);
    const damageVulnerabilityData = this._getGenericConditionAffectData("vulnerability", 3);

    damageImmunityData.forEach((data) => {
      if (data.value && data.value.length > 0)
        this.effect.changes.push(ChangeHelper.unsignedAddChange(data.value, 1, "system.traits.di.value"));
      if (data.bypass && data.bypass.length > 0)
        this.effect.changes.push(ChangeHelper.unsignedAddChange(data.bypass, 1, "system.traits.di.bypasses"));
    });
    damageResistanceData.forEach((data) => {
      if (data.value && data.value.length > 0)
        this.effect.changes.push(ChangeHelper.unsignedAddChange(data.value, 1, "system.traits.dr.value"));
      if (data.bypass && data.bypass.length > 0)
        this.effect.changes.push(ChangeHelper.unsignedAddChange(data.bypass, 1, "system.traits.dr.bypasses"));
    });
    damageVulnerabilityData.forEach((data) => {
      if (data.value && data.value.length > 0)
        this.effect.changes.push(ChangeHelper.unsignedAddChange(data.value, 1, "system.traits.dv.value"));
      if (data.bypass && data.bypass.length > 0)
        this.effect.changes.push(ChangeHelper.unsignedAddChange(data.bypass, 1, "system.traits.dv.bypasses"));
    });

    const conditionImmunityData = this._getGenericConditionAffectData("immunity", 4);

    conditionImmunityData.forEach((data) => {
      if (data.value && data.value.length > 0)
        this.effect.changes.push(ChangeHelper.unsignedAddChange(data.value, 1, "system.traits.ci.value"));
      if (data.bypass && data.bypass.length > 0)
        this.effect.changes.push(ChangeHelper.unsignedAddChange(data.bypass, 1, "system.traits.ci.bypasses"));
    });

    // system.traits.di.all
    const allDamageImmunity = DDBHelper.filterModifiersOld(this.grantedModifiers, "immunity", "all");
    if (allDamageImmunity?.length > 0) {
      this.effect.changes.push(ChangeHelper.unsignedAddChange("all", 1, "system.traits.di.value"));
    }
  }

  _addCriticalHitImmunities() {
    if (!game.modules.get("midi-qol")?.active) return;
    const result = DDBHelper.filterModifiersOld(this.grantedModifiers, "immunity", "critical-hits");

    if (result.length > 0) {
      logger.debug(`Generating critical hit immunity for ${this.document.name}`);
      const change = ChangeHelper.customChange(1, 1, "flags.midi-qol.fail.critical.all");
      this.effect.changes.push(change);
    }
  }

  _addAbilityAdvantageEffect(subType, type) {
    const bonuses = DDBHelper.filterModifiersOld(this.grantedModifiers, "advantage", subType);

    if (!game.modules.get("midi-qol")?.active) return;
    if (bonuses.length > 0) {
      logger.debug(`Generating ${subType} saving throw advantage for ${this.document.name}`);
      const ability = DICTIONARY.character.abilities.find((ability) => ability.long === subType.split("-")[0]).value;
      this.effect.changes.push(ChangeHelper.customChange(1, 4, `flags.midi-qol.advantage.ability.${type}.${ability}`));
    }
  }

  _addStatSetEffect(subType) {
    const bonuses = this.grantedModifiers.filter((modifier) => modifier.type === "set" && modifier.subType === subType);

    // dwarfen "Maximum of 20"
    if (bonuses.length > 0) {
      bonuses.forEach((bonus) => {
        logger.debug(`Generating ${subType} stat set for ${this.document.name}`);
        const ability = DICTIONARY.character.abilities.find((ability) => ability.long === subType.split("-")[0]).value;
        this.effect.changes.push(ChangeHelper.upgradeChange(bonus.value, 3, `system.abilities.${ability}.value`));
      });
    }
  }

  _addStatChanges() {
    const stats = ["strength", "dexterity", "constitution", "wisdom", "intelligence", "charisma"];
    stats.forEach((stat) => {
      const ability = DICTIONARY.character.abilities.find((ab) => ab.long === stat);
      this._addStatSetEffect(`${stat}-score`);
      this._addAbilityAdvantageEffect(`${stat}-saving-throws`, "save");
      this._addAbilityAdvantageEffect(`${stat}-ability-checks`, "check");
      this._addAddBonusChanges(this.grantedModifiers, `${stat}-saving-throws`, `system.abilities.${ability.value}.bonuses.save`);
      this._addAddBonusChanges(this.grantedModifiers, `${stat}-ability-checks`, `system.abilities.${ability.value}.bonuses.check`);
    });
  }

  _addStatBonusEffect(subType) {
    const bonuses = this.grantedModifiers.filter((modifier) =>
      (modifier.type === "bonus" || modifier.type === "stacking-bonus")
      && modifier.subType === subType);

    if (bonuses.length > 0) {
      bonuses.forEach((bonus) => {
        logger.debug(`Generating ${subType} stat bonus for ${this.document.name}`);
        const ability = DICTIONARY.character.abilities.find((ability) => ability.long === subType.split("-")[0]);

        if (game.modules.get("dae")?.active) {
          const bonusString = `min(@abilities.${ability.value}.max, @abilities.${ability.value}.value + ${bonus.value})`;
          // min(20, @abilities.con.value + 2)
          this.effect.changes.push(ChangeHelper.overrideChange(bonusString, 5, `system.abilities.${ability.value}.value`));
        } else {
          this.effect.changes.push(ChangeHelper.signedAddChange(bonus.value, 5, `system.abilities.${ability.value}.value`));
        }
      });
    }
  }

  _addStatBonuses() {
    [
      "strength-score",
      "dexterity-score",
      "constitution-score",
      "wisdom-score",
      "intelligence-score",
      "charisma-score",
    ].forEach((stat) => {
      this._addStatBonusEffect(stat);
    });
  }

  _addSenseBonus() {
    const senses = ["darkvision", "blindsight", "tremorsense", "truesight"];

    senses.forEach((sense) => {
      const base = this.grantedModifiers
        .filter((modifier) => modifier.type === "set-base" && modifier.subType === sense)
        .map((mod) => mod.value);
      if (base.length > 0) {
        logger.debug(`Generating ${sense} base for ${this.document.name}`);
        this.effect.changes.push(ChangeHelper.upgradeChange(Math.max(base), 10, `system.attributes.senses.${sense}`));
        if (AutoEffects.effectModules().atlInstalled) {
          this.effect.changes.push(ChangeHelper.upgradeChange(Math.max(base), 10, "ATL.sight.range"));
          this.effect.changes.push(ChangeHelper.atlChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, sense, 5));
        }
      }
      const bonus = this.grantedModifiers
        .filter((modifier) => modifier.type === "sense" && modifier.subType === sense)
        .reduce((a, b) => a + b.value, 0);
      if (bonus > 0) {
        logger.debug(`Generating ${sense} bonus for ${this.document.name}`);
        this.effect.changes.push(ChangeHelper.unsignedAddChange(Math.max(bonus), 20, `system.attributes.senses.${sense}`));
        if (AutoEffects.effectModules().atlInstalled) {
          this.effect.changes.push(ChangeHelper.unsignedAddChange(Math.max(bonus), 20, "ATL.sight.range"));
          this.effect.changes.push(ChangeHelper.atlChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, sense, 6));
        }
      }
    });
  }

  _addProficiencyBonus() {
    const bonus = DDBHelper.filterModifiersOld(this.grantedModifiers, "bonus", "proficiency-bonus").reduce((a, b) => a + b.value, 0);
    if (bonus) {
      logger.debug(`Generating proficiency bonus for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.unsignedAddChange(bonus, 0, "system.attributes.prof"));
    }
  }

  _addSetSpeedEffect(subType) {
    const bonuses = this.grantedModifiers.filter((modifier) => modifier.type === "set" && modifier.subType === subType);

    // "Equal to Walking Speed"
    if (bonuses.length > 0) {
      bonuses.forEach((bonus) => {
        logger.debug(`Generating ${subType} speed set for ${this.document.name}`);
        const innate = subType.split("-").slice(-1)[0];
        const speedType = DICTIONARY.character.speeds.find((s) => s.innate === innate).type;
        // current assumption if no speed provided, set to walking speed
        const speed = bonus.value ? bonus.value : "@attributes.movement.walk";
        this.effect.changes.push(ChangeHelper.upgradeChange(speed, 5, `system.attributes.movement.${speedType}`));
      });
    }
  }

  _addSetSpeeds() {
    [
      "innate-speed-walking",
      "innate-speed-climbing",
      "innate-speed-swimming",
      "innate-speed-flying",
      "innate-speed-burrowing",
      "speed-walking",
      "speed-climbing",
      "speed-swimming",
      "speed-flying",
      "speed-burrowing",
    ].forEach((speedSet) => {
      this._addSetSpeedEffect(speedSet);
    });

  }

  _addSpellAttackBonuses() {
    this._addAddBonusChanges(this.grantedModifiers, "spell-attacks", "system.bonuses.msak.attack");
    this._addAddBonusChanges(this.grantedModifiers, "melee-spell-attacks", "system.bonuses.msak.attack");
    this._addAddBonusChanges(this.grantedModifiers, "spell-attacks", "system.bonuses.rsak.attack");
    this._addAddBonusChanges(this.grantedModifiers, "ranged-spell-attacks", "system.bonuses.rsak.attack");
    this._addAddBonusChanges(this.grantedModifiers, "warlock-spell-attacks", "system.bonuses.msak.attack");
    this._addAddBonusChanges(this.grantedModifiers, "warlock-spell-attacks", "system.bonuses.msak.attack");
    this._addAddBonusChanges(this.grantedModifiers, "warlock-spell-save-dc", "system.bonuses.spell.dc");
    this._addAddBonusChanges(this.grantedModifiers, "spell-save-dc", "system.bonuses.spell.dc");
    this._addCustomChange(
      this.grantedModifiers,
      "spell-group-healing",
      "system.bonuses.heal.damage",
      " + @item.level",
    );
  }

  _addSkillProficiencies() {
    DICTIONARY.character.skills.forEach((skill) => {
      const prof = this.proficiencyFinder.getSkillProficiency(skill, this.grantedModifiers);
      if (prof != 0) {
        this.effect.changes.push(ChangeHelper.upgradeChange(prof, 9, `system.skills.${skill.name}.value`));
      }
    });
  }

  _addProficiencies() {

    const proficiencies = this.grantedModifiers
      .filter((mod) => mod.type === "proficiency")
      .map((mod) => {
        return { name: mod.friendlySubtypeName };
      });

    this._addSkillProficiencies();
    const toolProf = this.proficiencyFinder.getToolProficiencies(proficiencies);
    const weaponProf = this.proficiencyFinder.getWeaponProficiencies(proficiencies);
    const armorProf = this.proficiencyFinder.getArmorProficiencies(proficiencies);

    for (const [key, value] of Object.entries(toolProf)) {
      logger.debug(`Generating tool proficiencies for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.customChange(value.value, 8, `system.tools.${key}.value`));
      this.effect.changes.push(ChangeHelper.customChange(`${value.ability}`, 8, `system.tools.${key}.ability`));
      this.effect.changes.push(ChangeHelper.customChange("0", 8, `system.tools.${key}.bonuses.check`));
    }
    weaponProf.value.forEach((prof) => {
      logger.debug(`Generating weapon proficiencies for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.unsignedAddChange(prof, 8, "system.traits.weaponProf.value"));
    });
    armorProf.value.forEach((prof) => {
      logger.debug(`Generating armor proficiencies for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.unsignedAddChange(prof, 8, "system.traits.armorProf.value"));
    });
    // if (toolProf?.custom != "") changes.push(generateCustomChange(toolProf.custom, 8, "system.traits.toolProf.custom"));
    if (weaponProf?.custom != "") {
      this.effect.changes.push(ChangeHelper.unsignedAddChange(weaponProf.custom, 8, "system.traits.weaponProf.custom"));
    }
    if (armorProf?.custom != "") {
      this.effect.changes.push(ChangeHelper.unsignedAddChange(armorProf.custom, 8, "system.traits.armorProf.custom"));
    }
  }

  _addHPEffect() {
    // HP per level
    DDBHelper.filterModifiersOld(this.grantedModifiers, "bonus", "hit-points-per-level").forEach((bonus) => {
      const cls = DDBHelper.findClassByFeatureId(this.ddb, bonus.componentId);
      if (cls) {
        logger.debug(`Generating HP Per Level effects for ${this.document.name} for class ${cls.definition.name}`);
        this.effect.changes.push(ChangeHelper.unsignedAddChange(`${bonus.value} * @classes.${cls.definition.name.toLowerCase()}.levels`, 14, "system.attributes.hp.bonuses.overall"));
      } else {
        logger.debug(`Generating HP Per Level effects for ${this.document.name} for all levels`);
        this.effect.changes.push(ChangeHelper.unsignedAddChange(bonus.value, 14, "system.attributes.hp.bonuses.level"));
      }
    });

    const hpBonusModifiers = DDBHelper.filterModifiersOld(this.grantedModifiers, "bonus", "hit-points");
    if (hpBonusModifiers.length > 0 && !this.ddbItem.definition.isConsumable) {
      let hpBonus = "";
      hpBonusModifiers.forEach((modifier) => {
        let hpParse = DDBHelper.extractModifierValue(modifier);
        if (hpBonus !== "") hpBonus += " + ";
        hpBonus += hpParse;
      });
      this.effect.changes.push(ChangeHelper.unsignedAddChange(`${hpBonus}`, 14, "system.attributes.hp.bonuses.overall"));
    }
  }

  _addSkillBonusEffect(modifiers, skill) {
    const bonus = DDBHelper.getValueFromModifiers(modifiers, this.document.name, skill.subType, "bonus");
    if (bonus) {
      logger.debug(`Generating ${skill.subType} skill bonus for ${this.document.name}`, bonus);
      this.effect.changes.push(ChangeHelper.unsignedAddChange(bonus, 12, `system.skills.${skill.name}.bonuses.check`));
    }
  }

  _addSkillMidiEffect(modifiers, skill, midiEffect = "advantage") {
    if (!game.modules.get("midi-qol")?.active) return;
    const allowedRestrictions = [
      "",
      null,
      "Sound Only",
      "Sight Only",
      "that rely on smell",
      "While the hood is up, checks made to Hide ",
    ];
    const advantage = DDBHelper.filterModifiersOld(modifiers, midiEffect, skill.subType, allowedRestrictions);
    if (advantage.length > 0) {
      logger.debug(`Generating ${skill.subType} skill ${midiEffect} for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.customChange(1, 5, `flags.midi-qol.${midiEffect}.skill.${skill.name}`));
      // handled by midi already
      // advantage/disadvantage on skill grants +/-5 passive bonus, https://www.dndbeyond.com/sources/phb/using-ability-scores#PassiveChecks
      // if (midiEffect === "advantage") {
      //   effects.push(generateAddChange(5, 5, `system.skills.${skill.name}.bonuses.passive`));
      // } else if (midiEffect === "disadvantage") {
      //   effects.push(generateAddChange(-5, 5, `system.skills.${skill.name}.bonuses.passive`));
      // }
    }
  }

  _addSkillPassiveBonusEffect(modifiers, skill) {
    const bonus = DDBHelper.getValueFromModifiers(modifiers, this.document.name, `passive-${skill.subType}`, "bonus");
    if (bonus) {
      logger.debug(`Generating ${skill.subType} skill bonus for ${this.document.name}`, bonus);
      this.effect.changes.push(ChangeHelper.unsignedAddChange(bonus, 12, `system.skills.${skill.name}.bonuses.passive`));
    }
  }

  _addSkillBonuses() {
    DICTIONARY.character.skills.forEach((skill) => {
      const newMods = this.grantedModifiers.filter((mod) => {
        if (mod.subType === `passive-${skill.subType}`) {
          const passiveMods = DDBHelper.filterModifiersOld(this.grantedModifiers, "bonus", `passive-${skill.subType}`);
          const advantageMods = DDBHelper.filterModifiersOld(this.grantedModifiers, "advantage", skill.subType);
          if (passiveMods.length > 0 && advantageMods.length > 0) return false;
          else return true;
        } else {
          return true;
        }
      });
      this._addSkillBonusEffect(newMods, skill);
      this._addSkillPassiveBonusEffect(newMods, skill);
      this._addSkillMidiEffect(newMods, skill, "advantage");
    });
  }

  _addInitiativeBonuses() {
    const advantage = DDBHelper.filterModifiersOld(this.grantedModifiers, "advantage", "initiative");
    if (advantage.length > 0) {
      logger.debug(`Generating Initiative advantage for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.unsignedAddChange(1, 20, "flags.dnd5e.initiativeAdv"));
    }

    const advantageBonus = DDBHelper.getValueFromModifiers(this.grantedModifiers, "initiative", "initiative", "bonus");
    // alert feet gets special bonus
    if (advantageBonus && this.document.name !== "Alert") {
      logger.debug(`Generating Initiative bonus for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.unsignedAddChange(advantageBonus, 20, "system.attributes.init.bonus"));
    }
  }

  _addAttackRollDisadvantage() {
    if (!game.modules.get("midi-qol")?.active) return;
    const disadvantage = DDBHelper.filterModifiersOld(this.grantedModifiers, "disadvantage", "attack-rolls-against-you", false);
    if (disadvantage.length > 0) {
      logger.debug(`Generating disadvantage for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.customChange(1, 5, "flags.midi-qol.grants.disadvantage.attack.all"));
    }
  }

  _addMagicalAdvantage() {
    if (!game.modules.get("midi-qol")?.active) return;
    const restrictions = [
      "against spells and magical effects",
      "Against Spells and Magical Effects",
      "Against Spells",
      "against spells",
      "Against spells",
      "Against spells and magical effects within 10 ft. (or 30 ft. at level 17+) while holding the Holy Avenger",
    ];
    const advantage = DDBHelper.filterModifiersOld(this.grantedModifiers, "advantage", "saving-throws", restrictions);
    if (advantage.length > 0) {
      logger.debug(`Generating magical advantage on saving throws for ${this.document.name}`);
      this.effect.changes.push(ChangeHelper.customChange("1", 5, "flags.midi-qol.magicResistance.all"));
      // changes.push(generateCustomChange("magic-resistant", 5, "system.traits.dr.custom"));
    }
  }

  _addBonusSpeedChanges(subType, speedType = null) {
    const bonuses = this.grantedModifiers.filter((modifier) => modifier.type === "bonus" && modifier.subType === subType);
    // "Equal to Walking Speed"
    // max(10+(ceil(((@classes.monk.levels)-5)/4))*5,10)
    if (bonuses.length > 0) {
      logger.debug(`Generating ${subType} speed bonus for ${this.document.name}`);
      if (!speedType) {
        const innate = subType.split("-").slice(-1)[0];
        speedType = DICTIONARY.character.speeds.find((s) => s.innate === innate).type;
      }
      const bonusValue = bonuses.reduce((speed, mod) => speed + mod.value, 0);
      if (speedType === "all") {
        this.effect.changes.push(ChangeHelper.unsignedAddChange(`+ ${bonusValue}`, 9, `system.attributes.movement.${speedType}`));
      } else {
        this.effect.changes.push(ChangeHelper.unsignedAddChange(bonusValue, 9, `system.attributes.movement.${speedType}`));
      }
    }
  }

  _addBonusSpeeds() {
    const speedBonuses = ["speed-walking", "speed-climbing", "speed-swimming", "speed-flying", "speed-burrowing"];
    speedBonuses.forEach((speed) => {
      this._addBonusSpeedChanges(speed);
    });

    this._addBonusSpeedChanges("unarmored-movement", "walk");
    this._addBonusSpeedChanges("speed", "walk");
    // probably all, but doesn't handle cases of where no base speed set, so say fly gets set to 10.
  }

  _addWeaponAttackBonuses() {
    this._addAddBonusChanges(
      this.grantedModifiers,
      "melee-attacks",
      "system.bonuses.mwak.attack",
    );
    this._addAddBonusChanges(
      this.grantedModifiers,
      "ranged-attacks",
      "system.bonuses.rwak.attack",
    );
    this._addAddBonusChanges(
      this.grantedModifiers,
      "melee-weapon-attacks",
      "system.bonuses.mwak.attack",
    );
    this._addAddBonusChanges(
      this.grantedModifiers,
      "ranged-weapon-attacks",
      "system.bonuses.rwak.attack",
    );
    this._addAddBonusChanges(
      this.grantedModifiers,
      "weapon-attacks",
      "system.bonuses.mwak.attack",
    );
    this._addAddBonusChanges(
      this.grantedModifiers,
      "weapon-attacks",
      "system.bonuses.rwak.attack",
    );
  }

  _damageBonus(type, modifiers) {
    const bonus = modifiers
      .filter((mod) => mod.dice || mod.die || mod.value)
      .map((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        if (die) {
          return utils.parseDiceString(die.diceString, null, mod.subType ? `[${mod.subType}]` : null).diceString;
        } else {
          return utils.parseDiceString(mod.value, null, mod.subType ? `[${mod.subType}]` : null).diceString;
        }
      });
    if (bonus && bonus.length > 0) {
      logger.debug(`Generating ${type} damage for ${this.document.name}`);
      const change = ChangeHelper.unsignedAddChange(`${bonus.join(" + ")}`, 22, `system.bonuses.${type}.damage`);
      this.effect.changes.push(change);
    }
  }

  _addGlobalDamageBonus() {
    // melee restricted attacks
    const meleeRestrictions = ["Melee Weapon Attacks"];
    const meleeRestrictedMods = DDBHelper.filterModifiersOld(this.grantedModifiers, "damage", null, meleeRestrictions);
    this._damageBonus("mwak", meleeRestrictedMods);

    const rangedRestrictions = ["Ranged Weapon Attacks"];
    const rangedRestrictionMods = DDBHelper.filterModifiersOld(this.grantedModifiers, "damage", null, rangedRestrictions);
    this._damageBonus("rwak", rangedRestrictionMods);

    const DAMAGE_SUBTYPE_MAP = {
      "one-handed-melee-attacks": ["mwak"],
    };

    for (const [subtype, damageTypes] of Object.entries(DAMAGE_SUBTYPE_MAP)) {
      const subTypeMods = DDBHelper.filterModifiersOld(this.grantedModifiers, "damage", subtype);
      for (const damageType of damageTypes) {
        this._damageBonus(damageType, subTypeMods);
      }
    }

    const allBonusMods = DDBHelper.filterModifiersOld(this.grantedModifiers, "damage", null)
      .filter((mod) => !Object.keys(DAMAGE_SUBTYPE_MAP).includes(mod.subType))
      .filter((mod) => mod.dice || mod.die || mod.value);
    if (allBonusMods.length > 0) {
      logger.debug(`Generating all damage for ${this.document.name}`);
      this._damageBonus("mwak", allBonusMods);
      this._damageBonus("rwak", allBonusMods);
    }
  }

  _addAttunementSlots() {
    const bonus = DDBHelper.getValueFromModifiers(this.grantedModifiers, this.document.name, "attunement-slots", "set");
    if (bonus) {
      logger.debug(`Generating Attunement bonus for ${this.document.name}`, bonus);
      this.effect.changes.push(ChangeHelper.upgradeChange(bonus, (10 + bonus), "system.attributes.attunement.max"));
    }
  }

  _generateEffectDurationFromDocument(activity) {
    let duration = {
      seconds: null,
      startTime: null,
      rounds: null,
      turns: null,
      startRound: null,
      startTurn: null,
    };
    const foundryData = this.document?.system?.duration ?? activity?.duration;
    if (!foundryData) return duration;

    switch (foundryData?.units) {
      case "turn":
        duration.turns = foundryData.value;
        break;
      case "round":
        duration.rounds = foundryData.value;
        break;
      case "hour":
        duration.seconds = foundryData.value * 60 * 60;
        break;
      case "minute":
        duration.rounds = foundryData.value * 10;
        break;
      // no default
    }
    return duration;
  }

  _processConsumableEffect() {
    let label = `${this.document.name} - Consumable Effects`;
    this.effect.name = label;
    this.effect.disabled = false;
    this.effect.transfer = false;
    foundry.utils.setProperty(this.effect, "flags.ddbimporter.disabled", false);
    foundry.utils.setProperty(this.effect, "flags.dae.transfer", false);
    // DND 4.0: needs adjusting for activities
    // this.effect.duration = this._generateEffectDurationFromDocument(activity);
    // if (!this.document.system.target?.value) {
    //   this.document.system.target = {
    //     value: 1,
    //     width: null,
    //     units: "",
    //     type: "creature",
    //   };
    // }
    // if (!this.document.system.range?.units) {
    //   this.document.system.range = {
    //     value: null,
    //     long: null,
    //     units: "touch",
    //   };
    // }
    if (this.document.system.uses) {
      this.document.system.uses.autoDestroy = true;
      this.document.system.uses.autoUse = true;
    }
  }

  _addEffectFlags(effect) {
    // check attunement status etc

    if (
      !this.ddbItem.definition?.canEquip
      && !this.ddbItem.definition?.canAttune
      && !this.ddbItem.definition?.isConsumable
      && DICTIONARY.types.inventory.includes(this.document.type)
    ) {
      // if item just gives a thing and not potion/scroll
      effect.disabled = false;
      foundry.utils.setProperty(effect, "flags.ddbimporter.disabled", false);
      foundry.utils.setProperty(this.document, "flags.dae.alwaysActive", true);
    } else if (
      this.isCompendiumItem
      || this.document.type === "feat"
      || (this.ddbItem.isAttuned && this.ddbItem.equipped) // if it is attuned and equipped
      || (this.ddbItem.isAttuned && !this.ddbItem.definition?.canEquip) // if it is attuned but can't equip
      || (!this.ddbItem.definition?.canAttune && this.ddbItem.equipped) // can't attune but is equipped
    ) {
      foundry.utils.setProperty(this.document, "flags.dae.alwaysActive", false);
      foundry.utils.setProperty(effect, "flags.ddbimporter.disabled", false);
      effect.disabled = false;
    } else {
      effect.disabled = true;
      foundry.utils.setProperty(effect, "flags.ddbimporter.disabled", true);
      foundry.utils.setProperty(this.document, "flags.dae.alwaysActive", false);
    }

    foundry.utils.setProperty(effect, "flags.ddbimporter.itemId", this.ddbItem.id);
    foundry.utils.setProperty(effect, "flags.ddbimporter.itemEntityTypeId", this.ddbItem.entityTypeId);
    // set dae flag for active equipped
    if (this.ddbItem.definition?.canEquip || this.ddbItem.definitio?.canAttune) {
      foundry.utils.setProperty(this.document, "flags.dae.activeEquipped", true);
    } else {
      foundry.utils.setProperty(this.document, "flags.dae.activeEquipped", false);
    }

    if (this.ddbItem.definition?.filterType === "Potion") {
      effect = this._processConsumableEffect();
    }
  }


  generateGenericEffects() {
    this._generateDataStub();
    this._addGlobalSavingBonusEffect();
    this._addAddBonusChanges(
      this.grantedModifiers,
      "ability-checks",
      "system.bonuses.abilities.check",
    );
    this._addAddBonusChanges(
      this.grantedModifiers,
      "skill-checks",
      "system.bonuses.abilities.skill",
    );
    this._addLanguages();
    this._addDamageConditions();
    this._addCriticalHitImmunities();
    this._addStatChanges();
    this._addStatBonuses();
    this._addSenseBonus();
    this._addProficiencyBonus();
    this._addSetSpeeds();
    this._addSpellAttackBonuses();
    this._addProficiencies();
    this._addHPEffect();
    this._addSkillBonuses();
    this._addInitiativeBonuses();
    this._addAttackRollDisadvantage();
    this._addMagicalAdvantage();
    this._addBonusSpeeds();
    this._addWeaponAttackBonuses();
    this._addGlobalDamageBonus();
    this._addAttunementSlots();

    const hasInitiative = this.effect.changes.find((c) => c.key === "system.attributes.init.bonus"
      && c.mode === CONST.ACTIVE_EFFECT_MODES.ADD);
    const hasCheck = this.effect.changes.find((c) => c.key === "system.bonuses.abilities.check"
      && c.mode === CONST.ACTIVE_EFFECT_MODES.ADD);

    if (hasInitiative && hasCheck) {
      this.effect.changes = this.effect.changes.filter((c) => !(c.key === "system.attributes.init.bonus"
        && c.mode === CONST.ACTIVE_EFFECT_MODES.ADD
        && c.value === hasCheck.value));
    }

    // if we don't have effects, lets return the item
    if (this.effect.changes.length === 0) return;

    this._addEffectFlags(this.effect);
    this.document.effects.push(this.effect);

  }

  // AC GENERATION


  _addACSetChange(subType) {
    let bonuses;

    if (this.grantedModifiers.some((mod) => mod.statId !== null && mod.type === "set" && mod.subType === subType)) {
      this.grantedModifiers.filter((mod) => mod.statId !== null && mod.type === "set" && mod.subType === subType)
        .forEach((mod) => {
          const ability = DICTIONARY.character.abilities.find((ability) => ability.id === mod.statId);
          if (bonuses) {
            bonuses += " ";
          } else {
            bonuses = "";
          }
          bonuses += `@abilities.${ability.value}.mod`;
        });
    } else {
      // others are picked up here e.g. Draconic Resilience
      const fixedValues = this.grantedModifiers.filter((mod) => mod.type === "set" && mod.subType === subType).map((mod) => mod.value);
      bonuses = Math.max(fixedValues);
    }

    const maxDexTypes = ["ac-max-dex-unarmored-modifier", "ac-max-dex-modifier"];

    if (bonuses && bonuses != 0) {
      const bonusSum = Number.isInteger(bonuses) ? 10 + bonuses : `10 + ${bonuses}`;
      let formula = "";
      switch (subType) {
        case "unarmored-armor-class": {
          let maxDexMod = 99;
          const ignoreDexMod = this.grantedModifiers.some((mod) => mod.type === "ignore" && mod.subType === "unarmored-dex-ac-bonus");
          const maxDexArray = this.grantedModifiers
            .filter((mod) => mod.type === "set" && maxDexTypes.includes(mod.subType))
            .map((mod) => mod.value);
          if (maxDexArray.length > 0) maxDexMod = Math.min(maxDexArray);
          if (ignoreDexMod) {
            formula = `${bonusSum}`;
          } else if (maxDexMod === 99) {
            formula = `${bonusSum} + @abilities.dex.mod`;
          } else {
            // formula = `@abilities.dex.mod > ${maxDexMod} ? ${bonusSum} + ${maxDexMod} : ${bonusSum} + @abilities.dex.mod`;
            formula = `min(${bonusSum} + ${maxDexMod}, ${bonusSum} + @abilities.dex.mod)`;
          }
          break;
        }
        default: {
          formula = `${bonusSum} + @abilities.dex.mod`;
        }
      }

      logger.debug(`Generating ${subType} AC set for ${this.document.name}: ${formula}`);
      this.effect.changes.push(
        {
          key: "system.attributes.ac.min",
          value: formula,
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 15,
        },
      );
    }
  }

  _addACSetChanges() {
    const stats = ["unarmored-armor-class"];
    stats.forEach((set) => {
      this._addACSetChange(set);
    });
  }


  _addACBonusChanges(subType, restrictions = ["while wearing heavy armor", "while not wearing heavy armor", "", null]) {
    const bonusModifiers = DDBHelper.filterModifiersOld(this.grantedModifiers, "bonus", subType, restrictions);
    const bonus = DDBHelper.getValueFromModifiers(bonusModifiers, "bonus");
    if (bonus) {
      logger.debug(`Generating ${subType} bonus for ${this.document.name}: ${bonus}`);
      this.effect.changes.push(ChangeHelper.unsignedAddChange(`+ ${bonus}`, 18, "system.attributes.ac.bonus"));
    }
  }

  _generateBaseACEffectChanges() {
    if (this.noGenerate) return;
    logger.debug(`Generating supported AC changes for ${this.document.name} for effect ${this.effect.name}`);

    // base ac from modifiers
    this._addACSetChanges();

    // ac bonus effects
    this._addACBonusChanges("armor-class");
    this._addACBonusChanges("unarmored-armor-class");
    this._addACBonusChanges("armored-armor-class");
    this._addACBonusChanges("dual-wield-armor-class");
  }

  _generateACEffectChangesForItem() {
    if (this.noGenerate) return;

    const acChanges = this._generateBaseACEffectChanges();
    if (acChanges.length === 0) return;

    this.effect.changes.push(...acChanges);
  }

  _generateBaseACItemEffect() {
    const noACValue = !this.document.system?.armor?.value;

    if (this.noGenerate && noACValue) return;
    logger.debug(`Generating supported AC effects for ${this.document.name}`);

    // generate flags for effect (e.g. checking attunement and equipped status)
    this._generateACEffectChangesForItem();
  }


  generateACEffects() {
    this._generateDataStub();
    switch (this.type) {
      case "infusion":
      case "equipment":
      case "item":
      case "feature":
      case "feat": {
        if (this.document.type === "equipment") {
          if (this.type === "infusion"
            || (this.document.system.type?.value
              && ["trinket", "clothing", "ring"].includes(this.document.system.type.value))
          ) {
            this._generateBaseACItemEffect();
          }
        } else if (this.effect.transfer || this.type === "infusion") {
          this._generateACEffectChangesForItem();
        } else {
          this._generateBaseACItemEffect();
        }
        break;
      }
      // no default
    }

    if (this.effect.changes.length === 0) return;
    // generate flags for effect (e.g. checking attunement and equipped status)
    this._addEffectFlags(this.effect);
    this.document.effects.push(this.effect);
  }

  generate() {
    if (this.noGenerate) return;
    logger.debug(`Auto Generating Effects for ${this.document.name}`, { ddbItem: this.ddbItem });

    this.generateGenericEffects();
    this.document = MidiEffects.applyDefaultMidiFlags(this.document);

    this.labelSuffix = "(AC)";
    this.generateACEffects();

    if (this.document.effects?.length > 0
      || foundry.utils.hasProperty(document, "flags.dae")
      || foundry.utils.hasProperty(document, "flags.midi-qol.onUseMacroName")
    ) {
      logger.debug(`${this.type} effect ${this.document.name}:`, {
        document: foundry.utils.duplicate(this.document),
      });
      foundry.utils.setProperty(this.document, "flags.ddbimporter.effectsApplied", true);
    }
  }

  static generateEffects({ ddb, character, ddbItem, document, isCompendiumItem, type, description = "" } = {}) {
    const generator = new EffectGenerator({
      ddb,
      character,
      ddbItem,
      document,
      isCompendiumItem,
      type,
      description,
    });

    generator.generate();
    return generator.document;

  }

}
