
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


  constructor({ type, name, parentFeature, ddbDefinition } = {}) {

    this.type = type.toLowerCase();
    this.activityType = CONFIG.DND5E.activityTypes[this.toLowerCase()];
    if (!this.activityType) {
      throw new Error(`Unknown Activity Type: ${this.type}, valid types are: ${Object.keys(CONFIG.DND5E.activityTypes)}`);
    }
    this.name = name;
    this.parent = parentFeature;

    this._init();
    this._generateDataStub();

    this.ddbFeature = ddbDefinition;
    this.ddbDefinition = ddbDefinition.definition ?? ddbDefinition;

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

  }

  _generateDescription() {

  }

  _generateDuration() {

  }

  _generateEffects() {

  }

  _generateRange() {

  }

  _generateTarget() {

  }

  async build({ isChoice = false } = {}) {

    // note spells do not have activation
    this._generateActivation();
    this._generateConsumption();
    this._generateDescription();
    this._generateDuration();
    this._generateEffects();
    this._generateRange();
    this._generateTarget();

  }

}
