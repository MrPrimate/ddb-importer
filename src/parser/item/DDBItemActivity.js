import logger from "../../logger.js";
import DDBBasicActivity from "../enrichers/DDBBasicActivity.js";


export default class DDBItemActivity extends DDBBasicActivity {

  _init() {
    logger.debug(`Generating DDBItemActivity ${this.name ?? this.type ?? "?"} for ${this.ddbParent.name}`);
  }


  constructor({ type, name, ddbParent, nameIdPrefix = null, nameIdPostfix = null } = {}) {
    super({
      type,
      name,
      ddbParent,
      foundryFeature: ddbParent.data,
      nameIdPrefix,
      nameIdPostfix,
    });

    this.actionInfo = ddbParent.actionInfo;

  }

  _generateConsumption({ targetOverrides = null, additionalTargets = null, consumeActivity = false } = {}) {
    let targets = [];
    let scaling = false;

    // types:
    // "attribute"
    // "hitDice"
    // "material"
    // "itemUses"

    if (consumeActivity) {
      targets.push({
        type: "activityUses",
        target: "", // this item
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (this.actionInfo.consumptionTargets?.length > 0) {
      targets = this.actionInfo.consumptionTargets;
    } else if (this.actionInfo.consumptionValue) {
      targets.push({
        type: "itemUses",
        target: "",
        value: this.actionInfo.consumptionValue,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (![0, null, undefined].includes(this.ddbParent.data.system.uses?.max)) {
      targets.push({
        type: "itemUses",
        target: "",
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    }

    if (additionalTargets) targets.push(...additionalTargets);

    this.data.consumption = {
      targets: targetOverrides ?? targets,
      scaling: {
        allowed: scaling,
        max: "",
      },
    };

  }

  // eslint-disable-next-line complexity
  build({
    activationOverride = null,
    additionalTargets = null,
    attackData = {},
    chatFlavor = null,
    checkOverride = null,
    consumeActivity = null,
    consumeItem = null,
    consumptionTargetOverrides = null,
    criticalDamage = null,
    criticalThreshold = undefined,
    damageParts = null,
    damageScalingOverride = null,
    data = null,
    ddbMacroOverride = null,
    durationOverride = null,
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
    generateSummon = false,
    generateTarget = true,
    generateUses = false,
    healingChatFlavor = null,
    healingPart = null,
    img = null,
    includeBaseDamage = true,
    noeffect = false,
    onSave = null,
    rangeOverride = null,
    roll = null,
    saveOverride = null,
    targetOverride = null,
    usesOverride = null,
  } = {}) {

    if (generateConsumption) this._generateConsumption({
      targetOverrides: consumptionTargetOverrides,
      additionalTargets,
      consumeActivity,
    });

    super.build({
      generateActivation,
      generateAttack,
      generateConsumption: false,
      generateCheck,
      generateDamage,
      generateDescription: generateDescription || chatFlavor,
      generateDuration,
      generateEffects,
      generateHealing,
      generateRange,
      generateSave,
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
      roll,
      targetOverride: targetOverride ?? this.actionInfo.target,
      checkOverride,
      rangeOverride: rangeOverride ?? this.actionInfo.range,
      activationOverride: activationOverride ?? this.actionInfo.activation,
      noManualActivation: true,
      durationOverride: durationOverride ?? this.actionInfo.duration,
      img,
      ddbMacroOverride,
      usesOverride: usesOverride ?? this.actionInfo.uses,
      additionalTargets,
      consumeActivity,
      consumeItem,
      saveOverride: saveOverride ?? this.actionInfo.save,
      data,
      attackData: foundry.utils.mergeObject({
        criticalThreshold,
        ability: this.actionInfo.ability,
        bonus: this.actionInfo.extraAttackBonus,
        flat: this.actionInfo.isFlat,
        type: this.actionInfo.meleeAttack ? "melee" : "ranged",
        classification: this.actionInfo.spellAttack ? "spell" : "weapon",
      }, attackData),
      includeBaseDamage: includeBaseDamage ?? true,
      criticalDamage,
      damageScalingOverride,
      healingPart: healingPart
        ? healingPart
        : this.ddbParent.healingParts.length > 0
          ? this.ddbParent.healingParts[0]
          : undefined,
      damageParts: damageParts
        ? damageParts
        : ["weapon", "staff"].includes(this.ddbParent.parsingType)
          ? this.ddbParent.damageParts.slice(1)
          : this.ddbParent.damageParts,
    });

    if (this.data.uses && (!this.data.uses?.max || this.data.uses?.max === "")) {
      this.data.uses.spent = null;
    }

  }

}
