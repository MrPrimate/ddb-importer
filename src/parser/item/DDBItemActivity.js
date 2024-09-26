import utils from "../../lib/utils.js";
import logger from "../../logger.js";


export default class DDBItemActivity {

  _init() {
    logger.debug(`Generating DDBItemActivity ${this.name ?? this.type ?? "?"} for ${this.ddbParent.name}`);
  }

  _generateDataStub() {

    const rawStub = new this.activityType.documentClass({
      name: this.name,
      type: this.type,
    });

    this.data = rawStub.toObject();
    this.data._id = utils.namedIDStub(this.name ?? this.data.name ?? this.type, {
      prefix: this.nameIdPrefix,
      postfix: this.nameIdPostfix,
    });
  }


  constructor({ type, name, ddbParent, nameIdPrefix = null, nameIdPostfix = null } = {}) {

    this.type = type.toLowerCase();
    this.activityType = CONFIG.DND5E.activityTypes[this.type];
    if (!this.activityType) {
      throw new Error(`Unknown Activity Type: ${this.type}, valid types are: ${Object.keys(CONFIG.DND5E.activityTypes)}`);
    }
    this.name = name;
    this.ddbParent = ddbParent;
    this.data = ddbParent.data;
    this.actionInfo = ddbParent.actionInfo;

    this.nameIdPrefix = nameIdPrefix ?? "act";
    this.nameIdPostfix = nameIdPostfix ?? "";

    this._init();
    this._generateDataStub();

  }

  _generateActivation({ activationOverride = null } = {}) {
    if (activationOverride) {
      this.data.activation = activationOverride;
    } else {
      this.data.activation = this.actionInfo.activation;
    }
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

  _generateDescription({ overRide = null } = {}) {
    this.data.description = {
      chatFlavor: overRide ?? this.data.system?.chatFlavor ?? "",
    };
  }

  _generateDuration({ durationOverride = null } = {}) {
    this.data.duration = durationOverride ?? this.actionInfo.duration;
  }

  _generateEffects() {
    logger.debug(`Stubbed effect generation for ${this.name}`);
    // Enchantments need effects here
  }

  _generateRange() {
    this.data.range = this.actionInfo.range;
  }

  _generateTarget({ targetOverride = null } = {}) {
    this.data.target = targetOverride ?? this.actionInfo.target;
  }

  _generateDamage({ parts, includeBase = true, criticalDamage = null, onSave = null, scalingOverride = null } = {}) {
    this.data.damage = {
      onSave: onSave ?? "",
      critical: {
        bonus: criticalDamage ?? "",
      },
      includeBase,
      parts: parts
        ? parts
        : ["weapon", "staff"].includes(this.ddbParent.parsingType)
          ? this.ddbParent.damageParts.slice(1)
          : this.ddbParent.damageParts,
      scaling: scalingOverride ?? undefined,
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
      : this.ddbParent.healingParts.length > 0
        ? this.ddbParent.healingParts[0]
        : undefined;
    this.data.healing = healing;
  }

  _generateSave() {
    this.data.save = this.actionInfo.save;
  }


  _generateAttack({ criticalThreshold = undefined } = {}) {
    let classification = this.ddbParent.spellAttack
      ? "spell"
      : "weapon"; // unarmed, weapon, spell

    // staff.system.actionType = staff.system.range.long === 5 ? "mwak" : "rwak";
    let type = this.actionInfo.meleeAttack
      ? "melee"
      : "ranged";

    const attack = {
      ability: this.actionInfo.ability,
      bonus: `${this.actionInfo.extraAttackBonus}`,
      critical: {
        threshold: criticalThreshold,
      },
      flat: this.actionInfo.isFlat, // almost never false for PC features
      type: {
        value: type,
        classification,
      },
    };

    this.data.attack = attack;

  }

  _generateCheck({ checkOverride = null } = {}) {
    this.data.check = checkOverride ?? {
      associated: this.actionInfo.associatedToolsOrAbilities,
      ability: this.actionInfo.ability,
      dc: {},
    };
  }

  _generateUses({ usesOverride = null } = {}) {
    this.data.uses = usesOverride ?? this.actionInfo.uses;
  }

  build({
    damageParts = null,
    healingPart = null,
    generateActivation = true,
    generateAttack = false,
    generateConsumption = true,
    generateCheck = false,
    generateDamage = false,
    generateDescription = false,
    generateDuration = true,
    generateEffects = true,
    generateHealing = false,
    generateRange = true,
    generateSave = false,
    generateTarget = true,
    generateUses = false,
    includeBaseDamage = true,

    saveOverride = null,
    chatFlavor = null,
    targetOverrides = null,
    additionalTargets = null,
    usesOverride = null,
    criticalDamage = null,
    criticalThreshold = undefined,
    activationOverride = null,
    durationOverride = null,
    checkOverride = null,
    damageScalingOverride = null,
    onSave = null,
    consumeActivity = false,
  } = {}) {

    // override set to false on object if overriding

    logger.debug(`Generating Activity for ${this.ddbParent.name}`, {
      damageParts,
      healingPart,
      generateActivation,
      generateAttack,
      generateConsumption,
      generateCheck,
      generateDamage,
      generateDescription,
      generateDuration,
      generateEffects,
      generateHealing,
      generateRange,
      generateSave,
      generateTarget,
      includeBaseDamage,
      saveOverride,
      targetOverrides,
      additionalTargets,
      activationOverride,
      durationOverride,
      chatFlavor,
      checkOverride,
      damageScalingOverride,
      onSave,
      this: this,
    });

    if (generateActivation) this._generateActivation({ activationOverride });
    if (generateAttack) this._generateAttack({ criticalThreshold });
    if (generateConsumption) this._generateConsumption({ targetOverrides, additionalTargets, consumeActivity });
    if (generateDescription || chatFlavor) this._generateDescription({ overRide: chatFlavor });
    if (generateDuration) this._generateDuration({ durationOverride });
    if (generateEffects) this._generateEffects();
    if (generateRange) this._generateRange();
    if (generateTarget) this._generateTarget();
    if (generateUses) this._generateUses({ usesOverride });

    if (generateSave) {
      if (saveOverride) {
        this.save = saveOverride;
      } else {
        this._generateSave();
      }
    }
    if (generateDamage) this._generateDamage({
      parts: damageParts,
      includeBase: includeBaseDamage,
      criticalDamage,
      onSave,
      scalingOverride: damageScalingOverride,
    });
    if (generateHealing) this._generateHealing({ part: healingPart });

    if (generateCheck) this._generateCheck({ checkOverride });

    if (this.data.uses && (!this.data.uses?.max || this.data.uses?.max === "")) {
      this.data.uses.spent = null;
    }

    // ATTACK has
    // activation
    // attack
    // consumption
    // damage
    // description
    // duration
    // effects
    // range
    // target
    // type
    // uses

    // DAMAGE
    // activation
    // consumption
    // damage
    // description
    // duration
    // effects
    // range
    // target
    // type
    // uses


    // ENCHANT:
    // DAMAGE + enchant

    // HEAL
    // activation
    // consumption
    // healing
    // description
    // duration
    // effects
    // range
    // target
    // type
    // uses

    // SAVE
    // activation
    // consumption
    // damage
    // description
    // duration
    // effects
    // range
    // save
    // target
    // type
    // uses

    // SUMMON
    // activation
    // bonuses
    // consumption
    // creatureSizes
    // creatureTypes
    // description
    // duration
    // match
    // profles
    // range
    // summon
    // target
    // type
    // uses

    // UTILITY
    // activation
    // consumption
    // description
    // duration
    // effects
    // range
    // roll - name, formula, prompt, visible
    // target
    // type
    // uses


  }

  // static createActivity({ document, type, name, character } = {}, options = {}) {
  //   const activity = new DDBItemActivity({
  //     name: name ?? null,
  //     type,
  //     foundryFeature: document,
  //     actor: character,
  //   });

  //   activity.build(options);
  //   foundry.utils.setProperty(document, `system.activities.${activity.data._id}`, activity.data);

  //   return activity.data._id;

  // }

}
