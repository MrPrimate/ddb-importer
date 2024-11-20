import { logger } from "../../../lib/_module.mjs";
import AutoEffects from "./AutoEffects.mjs";

export default class EffectGenerator {

  _generateDataStub() {
    this.effect = AutoEffects.BaseEffect(this.document, this.label);
    this.effect.description = this.description;
  }

  constructor({ ddb, character, ddbItem, document, isCompendiumItem, labelOverride, description = "" } = {}) {
    this.ddb = ddb;
    this.character = character;
    this.ddbItem = ddbItem;
    this.document = document;
    this.isCompendiumItem = isCompendiumItem;
    this.labelOverride = labelOverride;
    this.description = description;

    if (!this.document.effects) {
      this.document.effects = [];
    }

    this.label = this.labelOverride ?? `${this.document.name}`;

    this._generateDataStub();

    this.grantedModifiers = ddbItem.definition?.grantedModifiers;
    this.noGenerate = !ddbItem.definition?.grantedModifiers || ddbItem.definition.grantedModifiers.length === 0;
  }

  generate() {
    if (this.noGenerate) return;

    logger.debug(`Generating Generic Effects for ${this.document.name}`, { ddbItem: this.ddbItem });

  }
}
