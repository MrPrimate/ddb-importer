import { logger } from "../../lib/_module.mjs";
import { DDBBasicActivity } from "../enrichers/mixins/_module.mjs";

export default class DDBVehicleActivity extends DDBBasicActivity {

  _init() {
    logger.debug(`Generating DDBVehicleActivity ${this.name ?? this.type ?? "?"} for ${this.actor.name}`);
  }

  constructor({ type, name, ddbParent, nameIdPrefix = null, nameIdPostfix = null, id = null } = {}) {
    super({
      type,
      name,
      ddbParent,
      foundryFeature: ddbParent.data,
      nameIdPrefix,
      nameIdPostfix,
      actor: ddbParent.ddbVehicle.data,
      id,
    });

    this.actionData = ddbParent.actionData;

  }

  _generateSave({ saveOverride = null, dc = null, ability = null } = {}) {
    if (saveOverride) {
      this.data.save = saveOverride;
      return;
    }
    this.data.save = {
      ability: ability ? [ability] : [Object.keys(CONFIG.DND5E.abilities)[0]],
      dc: {
        calculation: "",
        formula: dc ?? "",
      },
    };
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
    rollOverride,
    saveOverride,
    spellOverride,
    targetOverride,
    usesOverride,
    consumptionOverride = null,
    saveData = {},
  } = {}) {

    this._generateSave(foundry.utils.mergeObject({
      saveOverride,
    }, saveData));

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
      saveData,
      this: this,
    });

    super.build({
      generateActivation,
      generateAttack,
      generateSpell,
      generateConsumption,
      generateCheck,
      generateDamage,
      generateDescription,
      generateDuration,
      generateEffects,
      generateHealing,
      generateRange,
      generateSave: false,
      generateTarget,
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
      rollOverride,
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
