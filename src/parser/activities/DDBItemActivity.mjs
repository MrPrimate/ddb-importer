import { logger } from "../../lib/_module.mjs";
import { DDBBasicActivity } from "../enrichers/mixins/_module.mjs";


export default class DDBItemActivity extends DDBBasicActivity {

  _init() {
    logger.debug(`Generating DDBItemActivity ${this.name ?? this.type ?? "?"} for ${this.ddbParent.name}`);
  }


  constructor({ type, name, ddbParent, nameIdPrefix = null, nameIdPostfix = null, id = null } = {}) {
    super({
      type,
      name,
      ddbParent,
      foundryFeature: ddbParent.data,
      nameIdPrefix,
      nameIdPostfix,
      id,
    });

    this.actionData = ddbParent.actionData;

  }

  _generateConsumption({ targetOverrides = null, consumptionOverride = null, additionalTargets = [], consumeActivity = false } = {}) {
    if (consumptionOverride) {
      this.data.consumption = consumptionOverride;
      return;
    }
    let targets = [];
    let scaling = false;

    // types:
    // "attribute"
    // "hitDice"
    // "material"
    // "itemUses"

    const consumptionType = this.ddbParent.usesOnActivity
      ? "activityUses"
      : "itemUses";

    const isStaff = this.ddbParent.parsingType === "staff";

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
    } else if (this.actionData.consumptionTargets?.length > 0) {
      targets = this.actionData.consumptionTargets;
    } else if (this.actionData.consumptionValue) {
      targets.push({
        type: consumptionType,
        target: "",
        value: this.actionData.consumptionValue,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    } else if (isStaff) {
      // no op
    } else if (![0, null, undefined].includes(this.ddbParent.data.system.uses?.max)) {
      targets.push({
        type: consumptionType,
        target: "",
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    }

    if (additionalTargets && additionalTargets.length > 0) targets.push(...additionalTargets);

    this.data.consumption = {
      targets: targetOverrides ?? targets,
      scaling: {
        allowed: scaling,
        max: "",
      },
    };

  }

  _generateCheck({ checkOverride = null } = {}) {
    this.data.check = checkOverride ?? {
      associated: this.actionData.associatedToolsOrAbilities,
      ability: this.actionData.ability,
      dc: {},
    };
  }

  // eslint-disable-next-line complexity
  build({
    activationOverride = null,
    additionalTargets = null,
    attackData = {},
    spellOverride = null,
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
    generateSpell = false,
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
    rollOverride = null,
    saveOverride = null,
    targetOverride = null,
    usesOverride = null,
    consumptionOverride = null,
  } = {}) {

    if (generateConsumption) this._generateConsumption({
      targetOverrides: consumptionTargetOverrides,
      additionalTargets,
      consumeActivity,
      consumptionOverride,
    });

    if (generateCheck) this._generateCheck({ checkOverride });

    super.build({
      generateActivation,
      generateAttack,
      generateSpell,
      generateConsumption: false,
      generateCheck: false,
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
      spellOverride,
      rollOverride,
      targetOverride: targetOverride ?? this.actionData.target,
      checkOverride,
      rangeOverride: rangeOverride ?? this.actionData.range,
      activationOverride: activationOverride ?? this.actionData.activation,
      noManualActivation: true,
      durationOverride: durationOverride ?? this.actionData.duration,
      img,
      ddbMacroOverride,
      usesOverride: usesOverride ?? this.actionData.uses,
      additionalTargets,
      consumeActivity,
      consumeItem,
      saveOverride: saveOverride ?? this.actionData.save,
      data,
      attackData: foundry.utils.mergeObject({
        criticalThreshold,
        ability: this.actionData.ability,
        bonus: this.actionData.extraAttackBonus,
        flat: this.actionData.isFlat,
        type: this.actionData.meleeAttack ? "melee" : "ranged",
        classification: this.actionData.spellAttack ? "spell" : "weapon",
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
