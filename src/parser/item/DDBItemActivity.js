import utils from "../../../lib/utils.js";
import logger from "../../../logger.js";


export default class DDBItemActivity {

  _init() {
    logger.debug(`Generating DDBItemActivity ${this.name}`);
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


  constructor({ type, name, ddbItemData, nameIdPrefix = null, nameIdPostfix = null } = {}) {

    this.type = type.toLowerCase();
    this.activityType = CONFIG.DND5E.activityTypes[this.type];
    if (!this.activityType) {
      throw new Error(`Unknown Activity Type: ${this.type}, valid types are: ${Object.keys(CONFIG.DND5E.activityTypes)}`);
    }
    this.name = name;
    this.ddbItemData = ddbItemData;
    this.data = ddbItemData.data;
    this.actor = ddbItemData.rawCharacter;

    this.nameIdPrefix = nameIdPrefix ?? "act";
    this.nameIdPostfix = nameIdPostfix ?? "";

    this._init();
    this._generateDataStub();

  }

  _generateActivation() {
    this.data.activation = this.actionInfo.activation;
  }

  _generateConsumption() {
    let targets = [];
    let scaling = false;

    // types:
    // "attribute"
    // "hitDice"
    // "material"
    // "itemUses"

    if (this.actionInfo.consumptionTargets?.length > 0) {
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
    }

    this.data.consumption = {
      targets,
      scaling: {
        allowed: scaling,
        max: "",
      },
    };

  }

  _generateDescription(overRide = null) {
    this.data.description = {
      chatFlavor: overRide ?? this.data.system?.chatFlavor ?? "",
    };
  }

  _generateDuration() {
    this.data.duration = this.actionInfo.duration;
  }

  _generateEffects() {
    logger.debug(`Stubbed effect generation for ${this.name}`);
    // Enchantments need effects here
  }

  _generateRange() {
    this.data.range = this.actionInfo.range;
  }

  _generateTarget() {
    this.data.target = this.actionInfo.target;
  }

  _getFeaturePartsDamage() {
    let baseParts = this.ddbItemData.templateType === "weapon"
      ? this.actionInfo.damageParts.slice(1)
      : this.actionInfo.damageParts;

    return baseParts;
  }

  _generateDamage({ parts = [], includeBase = true } = {}) {
    this.data.damage = {
      includeBase,
      parts: parts.length > 0
        ? parts
        : this._getFeaturePartsDamage().map((data) => data.part),
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

  _generateHealing({ parts = [], includeBase = false } = {}) {
    this.data.healing = {
      includeBase,
      parts: parts.length > 0
        ? parts
        : this.actionInfo.healingParts.map((data) => data.part),
    };
  }

  _generateSave() {
    this.data.save = this.actionInfo.save;
  }


  _generateAttack() {
    let classification = this.ddbItemData.spellAttack
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
        threshold: undefined,
      },
      flat: this.actionInfo.isFlat, // almost never false for PC features
      type: {
        value: type,
        classification,
      },
    };

    this.data.attack = attack;

  }

  build({
    damageParts = [],
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
    includeBaseDamage = true,

    saveOverride = null,
    chatFlavor = null,
  } = {}) {

    // override set to false on object if overriding

    logger.debug(`Generating Activity for ${this.ddbItemData.name}`, {
      damageParts,
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
      chatFlavor,
      this: this,
    });

    if (generateActivation) this._generateActivation();
    if (generateAttack) this._generateAttack();
    if (generateConsumption) this._generateConsumption();
    if (generateDescription || chatFlavor) this._generateDescription(chatFlavor);
    if (generateDuration) this._generateDuration();
    if (generateEffects) this._generateEffects();
    if (generateRange) this._generateRange();
    if (generateTarget) this._generateTarget();

    if (generateSave) {
      if (saveOverride) {
        this.save = saveOverride;
      } else {
        this._generateSave();
      }
    }
    if (generateDamage) this._generateDamage({ parts: damageParts, includeBase: includeBaseDamage });
    if (generateHealing) this._generateHealing({ parts: damageParts, includeBase: includeBaseDamage });

    if (generateCheck) this._generateCheck();

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

  static createActivity({ document, type, name, character } = {}, options = {}) {
    const activity = new DDBItemActivity({
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
