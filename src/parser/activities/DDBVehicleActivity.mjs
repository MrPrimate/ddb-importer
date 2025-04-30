import { logger } from "../../lib/_module.mjs";
import { DDBBasicActivity } from "../enrichers/mixins/_module.mjs";

export default class DDBVehicleActivity extends DDBBasicActivity {

  _init() {
    logger.debug(`Generating DDBMonsterFeatureActivity ${this.name ?? this.type ?? "?"} for ${this.actor.name}`);
  }

  constructor({ type, name, ddbParent, nameIdPrefix = null, nameIdPostfix = null, id = null } = {}) {
    super({
      type,
      name,
      ddbParent,
      foundryFeature: ddbParent.data,
      nameIdPrefix,
      nameIdPostfix,
      actor: ddbParent.ddbMonster.npc,
      id,
    });

    this.actionInfo = ddbParent.actionInfo;
  }

  build({
    activationOverride,
    additionalTargets,
    attackData,
    chatFlavor,
    checkOverride = null,
    consumeActivity,
    consumeItem,
    criticalDamage,
    damageParts = [],
    damageScalingOverride,
    data,
    ddbMacroOverride,
    durationOverride,
    generateActivation = true,
    generateAttack = false,
    generateCheck = false,
    generateConsumption = true,
    generateDamage = false,
    generateDDBMacro = false,
    generateDescription = false,
    generateDuration = true,
    generateEffects = true,
    generateEnchant = false,
    generateHealing = false,
    generateRange = true,
    generateRoll = false,
    generateSave = false,
    generateSpell = false,
    generateSummon = false,
    generateTarget = true,
    generateUses,
    healingChatFlavor,
    healingPart = null,
    img,
    includeBaseDamage = true,
    noeffect,
    noManualActivation,
    onSave,
    rangeOverride,
    roll,
    saveOverride,
    spellOverride,
    targetOverride,
    usesOverride,
    consumptionOverride = null,
  } = {}) {

    // override set to false on object if overriding

    logger.debug(`Generating Activity for ${this.ddbParent.name}`, {
      damageParts,
      healingPart,
      generateActivation,
      generateAttack,
      generateConsumption,
      generateDamage,
      generateDescription,
      generateDuration,
      generateEffects,
      generateHealing,
      generateRange,
      generateSave,
      generateTarget,
      includeBaseDamage,
      generateCheck,
      checkOverride,
      generateDDBMacro,
      generateRoll,
      generateSummon,
      consumptionOverride,
      saveOverride,
      this: this,
    });

    if (generateActivation) this._generateActivation();
    if (generateAttack) this._generateAttack();
    if (generateConsumption) this._generateConsumption({ consumptionOverride });
    if (generateDescription) this._generateDescription();
    if (generateDuration) this._generateDuration();
    if (generateEffects) this._generateEffects();
    if (generateRange) this._generateRange();
    if (generateTarget) this._generateTarget();

    if (generateSave) this._generateSave({ saveOverride });
    if (generateDamage) this._generateDamage({ parts: damageParts, includeBase: includeBaseDamage });
    if (generateHealing) this._generateHealing({ part: healingPart });

    if (generateCheck) this._generateCheck({ checkOverride });

    super.build({
      generateActivation: false,
      generateAttack: false,
      generateSpell,
      generateConsumption: false,
      generateCheck: false,
      generateDamage: false,
      generateDescription,
      generateDuration: false,
      generateEffects: false,
      generateHealing: false,
      generateRange: false,
      generateSave: false,
      generateTarget: false,
      generateDDBMacro,
      generateEnchant,
      generateRoll,
      generateSummon,
      healingChatFlavor,
      generateUses,
      chatFlavor,
      onSave,
      noeffect,
      spellOverride,
      roll,
      targetOverride,
      checkOverride,
      rangeOverride,
      activationOverride,
      noManualActivation,
      durationOverride,
      img,
      ddbMacroOverride,
      usesOverride,
      additionalTargets,
      consumeActivity,
      consumeItem,
      saveOverride,
      data,
      attackData,
      includeBaseDamage,
      criticalDamage,
      damageScalingOverride,
      healingPart,
      damageParts,
    });


  }

  static createActivity({ document, type, name, vehicle } = {}, options = {}) {
    const activity = new DDBVehicleActivity({
      name: name ?? null,
      type,
      foundryFeature: document,
      actor: vehicle,
    });

    activity.build(options);
    foundry.utils.setProperty(document, `system.activities.${activity.data._id}`, activity.data);

    return activity.data._id;

  }

}
