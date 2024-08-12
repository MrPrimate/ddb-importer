
// game.dnd5e.documents.activity
// ActivityMixin(…)
// AttackActivity(…)
// DamageActivity(…)
// EnchantActivity(…)
// HealActivity(…)
// SaveActivity(…)
// SummonActivity(…)
// UtilityActivity(…)

import DICTIONARY from "../../dictionary";
import logger from "../../logger";


// CONFIG.DND5E.activityTypes


// TODO
// check effects for recharge and uses chages


export class DDBFeatureActivity {

  _init() {
    logger.debug(`Generating DDBActivity ${this.name}`);
  }

  _generateDataStub() {

    const rawStub = new this.activityType.documentClass({
      name: this.name,
      type: this.type,

    });

    this.data = rawStub.toObject();
  }


  constructor({ type, name, ddbFeature } = {}) {

    this.type = type.toLowerCase();
    this.activityType = CONFIG.DND5E.activityTypes[this.toLowerCase()];
    if (!this.activityType) {
      throw new Error(`Unknown Activity Type: ${this.type}, valid types are: ${Object.keys(CONFIG.DND5E.activityTypes)}`);
    }
    this.name = name;
    this.ddbFeature = ddbFeature;

    this._init();
    this._generateDataStub();

    this.ddbDefinition = this.ddbFeature.ddbDefinition;

  }

  static _getParsedAction(description) {
    // foundry doesn't support mythic actions pre 1.6
    const actionAction = description.match(/(?:as|spend|use) (?:a|an|your) action/ig);
    if (actionAction) return "action";
    const bonusAction = description.match(/(?:as|use|spend) (?:a|an|your) bonus action/ig);
    if (bonusAction) return "bonus";
    const reAction = description.match(/(?:as|use|spend) (?:a|an|your) reaction/ig);
    if (reAction) return "reaction";

    return undefined;
  }

  _generateParsedActivation() {
    const description = this.ddbDefinition.description && this.ddbDefinition.description !== ""
      ? this.ddbDefinition.description
      : this.ddbDefinition.snippet && this.ddbDefinition.snippet !== ""
        ? this.ddbDefinition.snippet
        : null;

    // console.warn(`Generating Parsed Activation for ${this.name}`, {description});

    if (!description) return;
    const actionType = DDBFeatureActivity._getParsedAction(description);
    if (!actionType) return;
    logger.debug(`Parsed manual activation type: ${actionType} for ${this.name}`);
    this.data.system.activation = {
      type: actionType,
      cost: 1,
      condition: "",
    };
  }

  // note spells do not have activation
  _generateActivation() {
    // console.warn(`Generating Activation for ${this.name}`);
    if (!this.ddbDefinition.activation) {
      this._generateParsedActivation();
      return;
    }
    const actionType = DICTIONARY.actions.activationTypes
      .find((type) => type.id === this.ddbDefinition.activation.activationType);
    if (!actionType) {
      this._generateParsedActivation();
      return;
    }

    this.data.activation = {
      type: actionType.value,
      value: this.ddbDefinition.activation.activationTime || 1,
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

    if (this.ddbFeature.rawCharacter) {
      Object.keys(this.rawCharacter.system.resources).forEach((resource) => {
        const detail = this.rawCharacter.system.resources[resource];
        if (this.ddbDefinition.name === detail.label) {
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
    const match = this.data.system.description.value.match(kiPointRegex);
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
    } else if (this.ddbFeature.resourceCharges !== null) {
      targets.push({
        type: "itemUses",
        target: "", // adjusted later
        value: this._resourceCharges,
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

  _generateDescription({ forceFull = false, extra = "" } = {}) {
    this.data.description = this.ddbFeature.getFeature({ forceFull, extra });
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
    if (this.ddbDefinition.range && this.ddbDefinition.range.aoeType && this.ddbDefinition.range.aoeSize) {
      this.data.range = {
        value: null,
        units: "self",
        special: "",
      };
    } else if (this.ddbDefinition.range && this.ddbDefinition.range.range) {
      this.data.range = {
        value: this.ddbDefinition.range.range,
        units: "ft",
        special: "",
      };
    } else {
      this.data.range = {
        value: 5,
        units: "ft",
        special: "",
      };
    }
  }

  _generateTarget() {
    const data = {
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

    if (this.ddbDefinition.range && this.ddbDefinition.range.aoeType && this.ddbDefinition.range.aoeSize) {
      foundry.utils.mergeObject(data, {
        template: {
          type: DICTIONARY.actions.aoeType.find((type) => type.id === this.ddbDefinition.range.aoeType)?.value ?? "",
          size: this.ddbDefinition.range.aoeSize,
          width: "",
        },
      });
    }

    // TODO: improve target parsing
    this.data.target = data;

  }


  _generateDamage(includeBase = false) {
    // TODO revisit or multipart damage parsing
    if (!this.ddbFeature.getDamage) return undefined;
    const damage = this.ddbFeature.getDamage();

    if (!damage) return undefined;

    return {
      includeBase,
      parts: [damage],
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

  async build({
    extraDescription = "",
    forceFullDescription = false,
    generateActivation = true,
    generateConsumption = true,
    generateDamage = false,
    generateDescription = false,
    generateDuration = true,
    generateEffects = true,
    generateRange = false,
    generateTarget = true,
  } = {}) {

    // override set to false on object if overrideing

    if (generateActivation) this._generateActivation();
    if (generateConsumption) this._generateConsumption();
    if (generateDescription) this._generateDescription({ forceFull: forceFullDescription, extra: extraDescription });
    if (generateDuration) this._generateDuration();
    if (generateEffects) this._generateEffects();
    if (generateRange) this._generateRange();
    if (generateTarget) this._generateTarget();
    if (generateDamage) this._generateDamage();


    // ATTACK has
    // ability
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
    // ability
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
    // roll
    // target
    // type
    // uses


  }

}
