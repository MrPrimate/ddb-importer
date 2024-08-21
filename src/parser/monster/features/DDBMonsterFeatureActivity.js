
// game.dnd5e.documents.activity
// ActivityMixin(…)
// AttackActivity(…)
// DamageActivity(…)
// EnchantActivity(…)
// HealActivity(…)
// SaveActivity(…)
// SummonActivity(…)
// UtilityActivity(…)

import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBBaseFeature from "../features/DDBBaseFeature.js";


// CONFIG.DND5E.activityTypes

export default class DDBMonsterFeatureActivity {

  _init() {
    logger.debug(`Generating DDBMonsterFeatureActivity ${this.name}`);
  }

  _generateDataStub() {

    const rawStub = new this.activityType.documentClass({
      name: this.name,
      type: this.type,
    });

    this.data = rawStub.toObject();
    this.data._id = utils.namedIDStub(this.name ?? this.feature.name ?? this.type, {
      prefix: this.nameIdPrefix,
      postfix: this.nameIdPostfix,
    });
  }


  constructor({ type, name, ddbMonsterFeature, nameIdPrefix = null, nameIdPostfix = null } = {}) {

    this.type = type.toLowerCase();
    this.activityType = CONFIG.DND5E.activityTypes[this.type];
    if (!this.activityType) {
      throw new Error(`Unknown Activity Type: ${this.type}, valid types are: ${Object.keys(CONFIG.DND5E.activityTypes)}`);
    }
    this.name = name;
    this.ddbMonsterFeature = ddbMonsterFeature;
    this.feature = ddbMonsterFeature.feature;
    this.actor = ddbMonsterFeature.ddbMonster.npc;

    this.nameIdPrefix = nameIdPrefix ?? "act";
    this.nameIdPostfix = nameIdPostfix ?? "";

    this._init();
    this._generateDataStub();

  }

  // note spells do not have activation
  _generateActivation() {
    const description = this.feature.system?.description?.value;

    if (!description) return;
    const actionType = DDBBaseFeature.getParsedAction(description);
    if (!actionType) return;
    logger.debug(`Parsed manual activation type: ${actionType} for ${this.name}`);
    this.data.activation = {
      type: actionType,
      value: 1,
      condition: "",
    };
  }

  _generateConsumption() {
    let targets = [];
    let scaling = false;

    // types:
    // "attribute"
    // "hitDice"
    // "material"
    // "itemUses"

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
      chatFlavor: this.feature.system?.chatFlavor ?? "",
    };
  }

  _generateDuration() {
    // TODO: improve duration parsing
    this.data.duration = {
      value: null,
      units: "inst",
      special: "",
    };
  }

  _generateEffects() {
    logger.debug(`Stubbed effect generation for ${this.name}`);
    // Enchantments need effects here
  }

  _generateRange() {
    this.data.range = {
      value: null,
      units: "ft",
      special: "",
    };
  }

  _generateTarget() {
    let data = {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "",
        type: "",
        choice: false,
        special: "",
      },
      prompt: true,
    };

    // if (this.ddbDefinition.range && this.ddbDefinition.range.aoeType && this.ddbDefinition.range.aoeSize) {
    //   data = foundry.utils.mergeObject(data, {
    //     template: {
    //       type: DICTIONARY.actions.aoeType.find((type) => type.id === this.ddbDefinition.range.aoeType)?.value ?? "",
    //       size: this.ddbDefinition.range.aoeSize,
    //       width: "",
    //     },
    //   });
    // }

    // TODO: improve target parsing
    this.data.target = data;

  }


  _generateDamage(includeBase = false) {
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

  _generateHealing(includeBase = false) {
    this.data.healing = {
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

  _generateSave() {
    this.data.save = {
      ability: Object.keys(CONFIG.DND5E.abilities)[0],
      dc: {
        calculation: "",
        formula: "",
      },
    };
  }


  _generateAttack({ type = "melee", unarmed = false, spell = false } = {}) {
    let classification = unarmed
      ? "unarmed"
      : spell
        ? "spell"
        : "weapon"; // unarmed, weapon, spell

    const attack = {
      ability: Object.keys(CONFIG.DND5E.abilities)[0],
      bonus: "",
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

  build({
    generateActivation = true,
    generateAttack = false,
    generateConsumption = true,
    generateDamage = false,
    generateDescription = false,
    generateDuration = true,
    generateEffects = true,
    generateHealing = false,
    generateRange = true,
    generateSave = false,
    generateTarget = true,
  } = {}) {

    // override set to false on object if overriding

    if (generateActivation) this._generateActivation();
    if (generateAttack) this._generateAttack();
    if (generateConsumption) this._generateConsumption();
    if (generateDescription) this._generateDescription();
    if (generateDuration) this._generateDuration();
    if (generateEffects) this._generateEffects();
    if (generateRange) this._generateRange();
    if (generateTarget) this._generateTarget();

    if (generateSave) this._generateSave();
    if (generateDamage) this._generateDamage();
    if (generateHealing) this._generateHealing();


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
