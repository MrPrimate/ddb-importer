import { logger } from "../../lib/_module.mjs";
import { DDBBasicActivity } from "../enrichers/mixins/_module.mjs";

export default class DDBMonsterFeatureActivity extends DDBBasicActivity {

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

    this.actionData = ddbParent.actionData;
  }

  _generateActivation() {
    this.data.activation = this.actionData.activation;
  }

  _generateConsumption({ consumptionOverride = null } = {}) {
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

    if (this.actionData.consumptionTargets?.length > 0) {
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
    }

    this.data.consumption = {
      targets,
      scaling: {
        allowed: scaling,
        max: "",
      },
    };

  }

  _generateDescription() {
    this.data.description = {
      chatFlavor: this.foundryFeature.system?.chatFlavor ?? "",
    };
  }

  _generateDuration() {
    this.data.duration = this.actionData.duration;
  }

  _generateEffects() {
    logger.debug(`Stubbed effect generation for ${this.name}`);
    // Enchantments need effects here
  }

  _generateRange() {
    this.data.range = this.actionData.range;
  }

  _generateTarget() {
    this.data.target = this.actionData.target;
  }

  _getFeaturePartsDamage() {
    let baseParts = this.ddbParent.templateType === "weapon"
      ? this.actionData.damageParts.slice(1)
      : this.actionData.damageParts;

    return baseParts;
  }

  _generateDamage({ parts = [], includeBase = true, allowCritical = null, onSave = "half" } = {}) {
    const companion = foundry.utils.getProperty(this.ddbParent.ddbMonster, "npc.flags.ddbimporter.entityTypeId") === "companion-feature";

    let damageParts = parts.length > 0
      ? parts
      : this._getFeaturePartsDamage().map((data) => data.part);

    if (companion) {
      damageParts = damageParts.map((data) => {
        data.bonus = data.bonus.replace("@prof", "").replace(/\s*[-+]\s*$/, "");
        return data;
      });
    }

    this.data.damage = {
      critical: {
        allow: allowCritical ?? (this.type === "attack" || this.foundryFeature.type === "weapon"),
      },
      onSave,
      includeBase,
      parts: damageParts,
    };

    // damage: {
    //   critical: {
    //     allow: false,
    //     bonus: source.system.critical?.damage
    //   },
    //   onSave: (source.type === "spell") && (source.system.level === 0) ? "none" : "half",
    //   includeBase: true,
    //   parts: damageParts.map(part => this.transformDamagePartData(source, part)) ?? []
    // }
  }

  _generateHealing({ part = null } = {}) {
    const healing = part
      ? part
      : this.actionData.healingParts.length > 0
        ? this.actionData.healingParts.map((data) => data.part)[0]
        : undefined;
    this.data.healing = healing;
  }

  _generateSave({ saveOverride = null } = {}) {
    if (saveOverride) {
      this.data.save = saveOverride;
      return;
    }
    this.data.save = this.actionData.save;
  }


  _generateAttack() {
    let classification = this.ddbParent.spellAttack
      ? "spell"
      : "weapon"; // unarmed, weapon, spell

    let type = this.ddbParent.rangedAttack
      ? "ranged"
      : "melee";

    const attack = {
      ability: this.actionData.baseAbility,
      bonus: this.actionData.extraAttackBonus && `${this.actionData.extraAttackBonus}`.trim() !== "0" ? `${this.actionData.extraAttackBonus}` : "",
      critical: {
        threshold: undefined,
      },
      flat: false, // almost never false for PC features
      type: {
        value: type,
        classification,
      },
    };

    this.data.attack = attack;

  }

  _generateCheck({ checkOverride = null }) {
    this.data.check = checkOverride ?? {
      associated: this.actionData.associatedToolsOrAbilities,
      ability: this.actionData.ability,
      dc: {},
    };
  }

  build({
    activationOverride,
    allowCritical,
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
      allowCritical,
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
    if (generateDamage) this._generateDamage({ parts: damageParts, includeBase: includeBaseDamage, allowCritical, onSave });
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
      allowCritical,
    });


  }

  static createActivity({ document, type, name, character } = {}, options = {}) {
    const activity = new DDBMonsterFeatureActivity({
      name: name ?? null,
      type,
      foundryFeature: document,
      actor: character,
    });

    activity.build(options);
    foundry.utils.setProperty(document, `system.activities.${activity.data._id}`, activity.data);

    return activity.data._id;

  }

}
