import { DDBHelper, logger, ProficiencyFinder } from "../../../lib/_module.mjs";
import AutoEffects from "./AutoEffects.mjs";
import ChangeHelper from "./ChangeHelper.mjs";
import MidiEffects from "./MidiEffects.mjs";

export default class EffectGenerator {

  _generateDataStub() {
    this.effect = AutoEffects.BaseEffect(this.document, this.label);
    this.effect.description = this.description;
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
    ddb, character, ddbItem, document, isCompendiumItem, labelOverride, type, description = "",
  } = {}) {
    this.ddb = ddb;
    this.type = type;
    this.character = character;
    this.ddbItem = ddbItem;
    this.document = document;
    this.isCompendiumItem = isCompendiumItem;
    this.labelOverride = labelOverride;
    this.description = description;

    if (!this.document.effects) {
      this.document.effects = [];
    }

    this._generateDataStub();

    this.grantedModifiers = ddbItem.definition?.grantedModifiers;
    this.noGenerate = !ddbItem.definition?.grantedModifiers || ddbItem.definition.grantedModifiers.length === 0;
  }


  addAddBonusChanges(modifiers, type, key) {
    // const bonus = DDBHelper.filterModifiersOld(modifiers, "bonus", type).reduce((a, b) => a + b.value, 0);
    const bonus = DDBHelper.getValueFromModifiers(modifiers, this.document.name, type, "bonus");
    if (bonus) {
      logger.debug(`Generating ${type} bonus for ${this.document.name}`, bonus);
      this.effect.changes.push(AutoEffects.unsignedAddChange(`+ ${bonus}`, 18, key));
    }
  }

  addLanguages() {
    const finder = new ProficiencyFinder({ ddb: this.ddb });
    const languages = finder.getLanguagesFromModifiers(this.grantedModifiers);

    languages.value.forEach((prof) => {
      logger.debug(`Generating language ${prof} for ${this.document.name}`);
      this.effect.changes.push(AutoEffects.unsignedAddChange(prof, 0, "system.traits.languages.value"));
    });
    if (languages?.custom != "") {
      logger.debug(`Generating language ${languages.custom} for ${this.document.name}`);
      this.effect.changes.push(AutoEffects.unsignedAddChange(languages.custom, 0, "system.traits.languages.custom"));
    }
  }

  addGlobalSavingBonusEffect() {
    const type = "saving-throws";
    const key = "system.bonuses.abilities.save";
    let changes = [];
    const regularBonuses = this.grantedModifiers.filter((mod) => !mod.bonusTypes?.includes(2));
    const customBonuses = this.grantedModifiers.filter((mod) => mod.bonusTypes?.includes(2));

    if (customBonuses.length > 0) {
      this.addAddBonusChanges(customBonuses, type, key);
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
      changes.push(AutoEffects.unsignedAddChange(`+ ${bonuses}`, 20, key));
      logger.debug(`Changes for ${type} bonus for ${this.document.name}`, changes);
    }

    this.effect.changes.push(...changes);

  }

  getGenericConditionAffectData(condition, typeId, forceNoMidi = false) {
    return AutoEffects.getGenericConditionAffectData(this.grantedModifiers, condition, typeId, forceNoMidi);
  }

  addDamageConditions() {

    const damageImmunityData = this.getGenericConditionAffectData("immunity", 2);
    const damageResistanceData = this.getGenericConditionAffectData("resistance", 1);
    const damageVulnerabilityData = this.getGenericConditionAffectData("vulnerability", 3);

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

    const conditionImmunityData = this.getGenericConditionAffectData("immunity", 4);

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

  _generateGenericEffects() {
    this.addGlobalSavingBonusEffect();
    this.addAddBonusChanges(
      this.grantedModifiers,
      "ability-checks",
      "system.bonuses.abilities.check",
    );
    this.addAddBonusChanges(
      this.grantedModifiers,
      "skill-checks",
      "system.bonuses.abilities.skill",
    );
    this.addLanguages();
    this.addDamageConditions();
    const criticalHitImmunity = addCriticalHitImmunities(this.grantedModifiers, this.document.name);
    const statSets = addStatChanges(this.grantedModifiers, this.document.name);
    const statBonuses = addStatBonuses(this.grantedModifiers, this.document.name);
    const senses = addSenseBonus(this.grantedModifiers, this.document.name);
    const proficiencyBonus = addProficiencyBonus(this.grantedModifiers, this.document.name);
    const speedSets = addSetSpeeds(this.grantedModifiers, this.document.name);
    const spellAttackBonuses = addSpellAttackBonuses(this.grantedModifiers, this.document.name);

    const profs = addProficiencies(this.grantedModifiers, this.document.name);
    const hp = addHPEffect(ddb, this.grantedModifiers, this.document.name, ddbItem.definition.isConsumable);
    const skillBonus = addSkillBonuses(this.grantedModifiers, this.document.name);
    const initiative = addInitiativeBonuses(this.grantedModifiers, this.document.name);
    const disadvantageAgainst = addAttackRollDisadvantage(this.grantedModifiers, this.document.name);
    const magicalAdvantage = addMagicalAdvantage(this.grantedModifiers, this.document.name);
    const bonusSpeeds = addBonusSpeeds(this.grantedModifiers, this.document.name);
    const weaponAttackBonuses = addWeaponAttackBonuses(this.grantedModifiers, this.document.name);
    const globalDamageBonus = addGlobalDamageBonus(this.grantedModifiers, this.document.name);
    const attunementAdjustment = addAttunementSlots(this.grantedModifiers, this.document.name);

    // fect.changes = [
    //   ...criticalHitImmunity,
    //   ...globalSaveBonus,
    //   ...globalAbilityBonus,
    //   ...globalSkillBonus,
    //   ...languages,
    //   ...conditions,
    //   ...statSets,
    //   ...statBonuses,
    //   ...senses,
    //   ...proficiencyBonus,
    //   ...speedSets,
    //   ...spellAttackBonuses,
    //   ...profs,
    //   ...hp,
    //   ...skillBonus,
    //   ...initiative,
    //   ...disadvantageAgainst,
    //   ...magicalAdvantage,
    //   ...bonusSpeeds,
    //   ...weaponAttackBonuses,
    //   ...globalDamageBonus,
    //   ...attunementAdjustment,
    // ];

    // console.warn("effect", {
    //   changes: effect.changes,
    //   foundryItem,
    //   ddbItem,
    //   effect,
    // });

    // const hasInitiative = effect.changes.find((c) => c.key === "system.attributes.init.bonus"
    //   && c.mode === CONST.ACTIVE_EFFECT_MODES.ADD);
    // const hasCheck = effect.changes.find((c) => c.key === "system.bonuses.abilities.check"
    //   && c.mode === CONST.ACTIVE_EFFECT_MODES.ADD);

    // if (hasInitiative && hasCheck) {
    //   effect.changes = effect.changes.filter((c) => !(c.key === "system.attributes.init.bonus"
    //     && c.mode === CONST.ACTIVE_EFFECT_MODES.ADD
    //     && c.value === hasCheck.value));
    // }

    // // if we don't have effects, lets return the item
    // if (effect.changes?.length === 0) {
    //   return [foundryItem, effect];
    // }

    // // generate flags for effect (e.g. checking attunement and equipped status)
    // [foundryItem, effect] = addEffectFlags(foundryItem, effect, ddbItem, isCompendiumItem);

    // return [foundryItem, effect];
  }

  generate() {
    logger.debug(`Generating ${this.document.name} auto effects`);

    if (this.noGenerate) return;

    logger.debug(`Generating Generic Effects for ${this.document.name}`, { ddbItem: this.ddbItem });

    // [foundryItem, effect] = generateGenericEffects({
    //   ddb,
    //   character,
    //   ddbItem,
    //   foundryItem,
    //   isCompendiumItem,
    //   labelOverride: label,
    //   description,
    // });


    this.document = MidiEffects.applyDefaultMidiFlags(this.document);


    // [foundryItem, effect] = addACEffect({
    //   ddb,
    //   character,
    //   ddbItem,
    //   foundryItem,
    //   isCompendiumItem,
    //   effect,
    //   type,
    // });

    if (this.document.effects.length > 0) {
      this.document.effects.push(this.effect);
    }

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
}
