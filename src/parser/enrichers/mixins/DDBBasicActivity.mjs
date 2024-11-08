import utils from "../../../lib/utils.js";
import logger from "../../../logger.js";

export default class DDBBasicActivity {

  _init() {
    logger.debug(`Generating DDBBasicActivity ${this.name}`);
  }

  _generateDataStub() {
    const rawStub = new this.activityType.documentClass({
      name: this.name,
      type: this.type,
    });

    this.data = rawStub.toObject();
    this.data._id = utils.namedIDStub(this.name ?? this.foundryFeature?.name ?? this.type, {
      prefix: this.nameIdPrefix,
      postfix: this.nameIdPostfix,
    });
  }


  constructor({
    type, name, foundryFeature = null, actor = null, ddbParent = null,
    nameIdPrefix = null, nameIdPostfix = null,
  } = {}) {

    this.type = type.toLowerCase();
    this.activityType = CONFIG.DND5E.activityTypes[this.type];
    if (!this.activityType) {
      throw new Error(`Unknown Activity Type: ${this.type}, valid types are: ${Object.keys(CONFIG.DND5E.activityTypes)}`);
    }
    this.name = name;
    this.ddbParent = ddbParent;
    this.foundryFeature = this.ddbParent?.data ?? foundryFeature;
    this.actor = actor;

    this.nameIdPrefix = nameIdPrefix ?? "act";
    this.nameIdPostfix = nameIdPostfix ?? "";

    this._init();
    this._generateDataStub();

  }

  getParsedAction() {
    const description = this.foundryFeature.system?.description?.value;
    if (!description) return undefined;
    // pcs don't have mythic
    const actionAction = description.match(/(?:as|spend|use) (?:a|an|your) action/ig);
    if (actionAction) return "action";
    const bonusAction = description.match(/(?:as|use|spend) (?:a|an|your) bonus action/ig);
    if (bonusAction) return "bonus";
    const reAction = description.match(/(?:as|use|spend) (?:a|an|your) reaction/ig);
    if (reAction) return "reaction";

    return undefined;
  }

  // note spells do not have activation
  _generateActivation({ activationOverride = null, noManual = false } = {}) {
    if (activationOverride) {
      this.data.activation = activationOverride;
      this.data.activation.override = true;
      return;
    }

    if (noManual) return;

    const description = this.foundryFeature.system?.description?.value;

    if (!description) return;
    const actionType = this.getParsedAction(description);
    if (!actionType) return;
    logger.debug(`Parsed manual activation type: ${actionType} for ${this.name}`);
    this.data.activation = {
      type: actionType,
      value: 1,
      condition: "",
    };
  }

  // eslint-disable-next-line no-unused-vars
  _generateConsumption({ targetOverrides = null, consumptionOverride = null, additionalTargets = [], consumeActivity = false, consumeItem = null } = {}) {
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

    // this is a spell with limited uses such as one granted by a feat
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
    } else if (consumeItem) {
      targets.push({
        type: "itemUses",
        target: "", // this item
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
    }

    // Future check for hit dice expenditure?
    // expend one of its Hit Point Dice,
    // you can spend one Hit Die to heal yourself.
    // right now most of these target other creatures

    // const kiPointRegex = /(?:spend|expend) (\d) (?:ki|focus) point/;
    // const match = this.foundryFeature.system?.description?.value.match(kiPointRegex);
    // if (match) {
    //   targets.push({
    //     type: "itemUses",
    //     target: "", // adjusted later
    //     value: match[1],
    //     scaling: {
    //       mode: "",
    //       formula: "",
    //     },
    //   });
    // }

    if (additionalTargets && additionalTargets.length > 0) targets.push(...additionalTargets);

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
      chatFlavor: overRide ?? this.foundryFeature.system?.chatFlavor ?? "",
    };
  }

  _generateEnchant() {
    logger.debug(`Stubbed enchantment generation for ${this.name}`);
  }

  _generateSummon() {
    logger.debug(`Stubbed summon generation for ${this.name}`);
  }

  _generateDuration({ durationOverride = null } = {}) {
    if (durationOverride) {
      this.data.duration = durationOverride;
      this.data.duration.override = true;
    }
  }

  _generateEffects() {
    logger.debug(`Stubbed effect generation for ${this.name}`);
    // Enchantments need effects here
  }

  _generateRange({ rangeOverride = null } = {}) {
    if (rangeOverride) {
      this.data.range = rangeOverride;
      this.data.range.override = true;
    }
  }

  _generateTarget({ targetOverride = null } = {}) {
    if (targetOverride) {
      this.data.target = targetOverride;
      this.data.target.override = true;
    }
  }

  _generateUses({ usesOverride = null } = {}) {
    if (usesOverride) {
      this.data.uses = usesOverride;
      this.data.uses.override = true;
    }
  }

  _generateCheck({ checkOverride = null } = {}) {
    if (checkOverride) {
      this.data.check = checkOverride;
    };
  }

  _generateDamage({ includeBase = false, damageParts = null, onSave = null, scalingOverride = null, criticalDamage = null } = {}) {
    if (damageParts) {
      this.data.damage = {
        parts: damageParts,
        onSave: onSave ?? "",
        includeBase,
        scaling: scalingOverride ?? undefined,
        critical: {
          bonus: criticalDamage ?? "",
        },
      };
      return;
    }

    this.data.damage = {
      includeBase,
      parts: [],
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

  _generateHealing({ healingPart, healingChatFlavor = null } = {}) {
    if (healingChatFlavor) this.data.description.chatFlavor = healingChatFlavor;
    this.data.healing = healingPart;
  }

  _generateSave({ saveOverride = null } = {}) {
    if (saveOverride) {
      this.data.save = saveOverride;
      return;
    }
    this.data.save = {
      ability: Object.keys(CONFIG.DND5E.abilities)[0],
      dc: {
        calculation: "",
        formula: "",
      },
    };
  }

  static deriveAttackClassification({ unarmed = false, spell = false } = {}) {
    return unarmed
      ? "unarmed"
      : spell
        ? "spell"
        : "weapon";
  }

  _generateAttack({
    type = "melee", unarmed = false, spell = false, classification = null,
    ability = null, bonus = "", criticalThreshold = undefined, flat = false,
  } = {}) {

    const attack = {
      ability: ability ?? Object.keys(CONFIG.DND5E.abilities)[0],
      bonus,
      critical: {
        threshold: criticalThreshold,
      },
      flat, // almost never false for PC features
      type: {
        value: type,
        classification: classification ?? DDBBasicActivity.deriveAttackClassification({ unarmed, spell }),
      },
    };

    this.data.attack = attack;

  }

  _generateRoll({ roll = null } = {}) {
    if (roll) {
      this.data.roll = roll;
    }
  }


  _generateDDBMacro({ ddbMacroOverride = null } = {}) {
    if (ddbMacroOverride) {
      this.data.macro = ddbMacroOverride;
    }
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

  // eslint-disable-next-line complexity
  build({
    activationOverride = null,
    additionalTargets = [],
    attackData = {},
    chatFlavor = null,
    checkOverride = null,
    consumeActivity = null,
    consumeItem = null,
    consumptionOverride = null,
    consumptionTargetOverrides = null,
    criticalDamage = null,
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
    includeBaseDamage = false,
    noeffect = false,
    noManualActivation = false,
    onSave = null,
    partialDamageParts = null,
    rangeOverride = null,
    roll = null,
    saveOverride = null,
    targetOverride = null,
    usesOverride = null,
  } = {}) {

    if (generateActivation) this._generateActivation({ activationOverride, noManual: noManualActivation });
    if (generateAttack) this._generateAttack(attackData);
    if (generateConsumption) this._generateConsumption({
      targetOverrides: consumptionTargetOverrides,
      consumptionOverride,
      additionalTargets,
      consumeActivity,
      consumeItem,
    });
    if (generateDescription) this._generateDescription({ overRide: chatFlavor });
    if (generateEffects) this._generateEffects();
    if (generateSave) this._generateSave({ saveOverride });
    if (generateDamage) this._generateDamage({
      damageParts,
      onSave,
      partialDamageParts,
      includeBase: includeBaseDamage,
      scalingOverride: damageScalingOverride,
      criticalDamage,
    });
    if (generateEnchant) this._generateEnchant();
    if (generateSummon) this._generateSummon();
    if (generateHealing) this._generateHealing({ healingPart, healingChatFlavor });
    if (generateRange) this._generateRange({ rangeOverride });
    if (generateTarget) this._generateTarget({ targetOverride });
    if (generateDuration) this._generateDuration({ durationOverride });
    if (generateDDBMacro) this._generateDDBMacro({ ddbMacroOverride });
    if (generateUses) this._generateUses({ usesOverride });
    if (generateRoll) this._generateRoll({ roll });
    if (generateCheck) this._generateCheck({ checkOverride });

    if (noeffect) {
      const ids = foundry.utils.getProperty(this.ddbParent.data, "flags.ddbimporter.noeffect") ?? [];
      ids.push(this.data._id);
      foundry.utils.setProperty(this.ddbParent.data, "flags.ddbimporter.noEffectIds", ids);
      foundry.utils.setProperty(this.data, "flags.ddbimporter.noeffect", true);
    }
    if (img) foundry.utils.setProperty(this.data, "img", img);
    if (data) foundry.utils.mergeObject(this.data, data);


  }

  static createActivity({ document, type, name, character, enricher } = {}, options = {}) {
    const activity = new DDBBasicActivity({
      name: name ?? null,
      type,
      foundryFeature: document,
      actor: character,
    });

    activity.build(options);
    enricher?.applyActivityOverride(activity.data);

    const effects = enricher?.createEffect() ?? [];
    document.effects.push(...effects);

    enricher?.addDocumentOverride();
    foundry.utils.setProperty(document, `system.activities.${activity.data._id}`, activity.data);
    enricher?.addAdditionalActivities(enricher?.ddbParent);

    return activity.data._id;

  }

  static parseBasicDamageFormula(data, formula, { stripMod = false } = {}) {
    const basicMatchRegex = /^\s*(\d+)d(\d+)(?:\s*([+|-])\s*(@?[\w\d.-]+))?\s*$/i;
    const damageMatch = `${formula}`.match(basicMatchRegex);

    if (damageMatch && CONFIG.DND5E.dieSteps.includes(Number(damageMatch[2]))) {
      data.number = Number(damageMatch[1]);
      data.denomination = Number(damageMatch[2]);
      if (damageMatch[4]) data.bonus = damageMatch[3] === "-" ? `-${damageMatch[4]}` : damageMatch[4];
      if (stripMod) data.bonus = data.bonus.replace(/@mod/, "").trim().replace(/^\+/, "").trim();
    } else if (Number.isInteger(Number.parseInt(formula))) {
      data.bonus = formula;
    } else {
      data.custom.enabled = true;
      data.custom.formula = formula;
    }
  }

  static buildDamagePart({ dice = null, damageString = "", type, stripMod = false } = {}) {
    const damage = {
      number: null,
      denomination: 0,
      bonus: "",
      types: type ? [type.toLowerCase()] : [],
      custom: {
        enabled: false,
        formula: "",
      },
      scaling: {
        mode: "", // whole, half or ""
        number: null,
        formula: "",
      },
    };

    if (dice && !dice.multiplier) {
      damage.number = dice.diceCount;
      damage.denomination = dice.diceValue;
      if (dice.fixedValue) damage.bonus = dice.fixedValue;
      if (dice.value) damage.bonus = dice.value;
    } else {
      DDBBasicActivity.parseBasicDamageFormula(damage, damageString, { stripMod });
    }
    return damage;
  }

}
