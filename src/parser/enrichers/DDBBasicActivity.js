
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
    this.data._id = utils.namedIDStub(this.name ?? this.foundryFeature.name ?? this.type, {
      prefix: this.nameIdPrefix,
      postfix: this.nameIdPostfix,
    });
  }


  constructor({ type, name, foundryFeature, actor = null, nameIdPrefix = null, nameIdPostfix = null } = {}) {

    this.type = type.toLowerCase();
    this.activityType = CONFIG.DND5E.activityTypes[this.type];
    if (!this.activityType) {
      throw new Error(`Unknown Activity Type: ${this.type}, valid types are: ${Object.keys(CONFIG.DND5E.activityTypes)}`);
    }
    this.name = name;
    this.foundryFeature = foundryFeature;
    this.actor = actor;

    this.nameIdPrefix = nameIdPrefix ?? "act";
    this.nameIdPostfix = nameIdPostfix ?? "";

    this._init();
    this._generateDataStub();

  }

  // note spells do not have activation
  _generateActivation() {
    const description = this.foundryFeature.system?.description?.value;

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

    if (this.actor) {
      Object.keys(this.actor.system.resources).forEach((resource) => {
        const detail = this.actor.system.resources[resource];
        if (this.foundryFeature.name === detail.label) {
          targets.push({
            type: "attribute",
            target: `resources.${resource}.value`,
            value: 1,
            scaling: {
              mode: "",
              formula: "",
            },
          });
        }
      });
    }

    // Future check for hit dice expenditure?
    // expend one of its Hit Point Dice,
    // you can spend one Hit Die to heal yourself.
    // right now most of these target other creatures

    const kiPointRegex = /(?:spend|expend) (\d) ki point/;
    const match = this.foundryFeature.system?.description?.value.match(kiPointRegex);
    if (match) {
      targets.push({
        type: "itemUses",
        target: "", // adjusted later
        value: match[1],
        scaling: {
          mode: "",
          formula: "",
        },
      });
    }
    // else if (this.ddbFeature.resourceCharges !== null) {
    //   targets.push({
    //     type: "itemUses",
    //     target: "", // adjusted later
    //     value: this._resourceCharges,
    //     scaling: {
    //       mode: "",
    //       formula: "",
    //     },
    //   });
    // }

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
    } else {
      data.custom.enabled = true;
      data.custom.formula = formula;
    }
  }

  static buildDamagePart({ dice = null, damageString = "", type, stripMod = false } = {}) {
    const damage = {
      number: null,
      denomination: null,
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
