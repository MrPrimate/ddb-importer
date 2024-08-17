import { baseEffect, baseItemEffect } from "../../effects/effects.js";
import { baseFeatEffect } from "../../effects/specialFeats.js";
import { baseMonsterFeatureEffect } from "../../effects/specialMonsters.js";
import { baseSpellEffect } from "../../effects/specialSpells.js";

export default class DDBBaseDictionary {

  NAME_HINTS = {};

  ACTIVITY_HINTS = {};

  DOCUMENT_OVERRIDES = {};

  EFFECT_HINTS = {};


  constructor({ document, name = null }) {
    this.document = document;
    this.name = name ?? document.flags?.ddbimporter?.originalName ?? document.name;

    this.hintName = this.NAME_HINTS[this.name] ?? this.name;
    this.activity = this.ACTIVITY_HINTS[this.hintName];
    this.effect = this.EFFECT_HINTS[this.hintName];
    this.override = this.DOCUMENT_OVERRIDES[this.hintName];

  }

  applyActivityOverride(activity) {
    if (!this.activity) return activity;

    if (this.activity.data) {
      activity = foundry.utils.mergeObject(
        activity,
        this.override.data,
      );
    }

    if (this.activity?.func) this.activity.func(activity);

    return activity;
  }

  // async applyOverride(document, activity) {
  //   await this._applyActivityOverride(activity);
  // }

  createEffect() {
    if (!this.effect) return undefined;

    let effect;

    let name = this.effect.name ?? this.name;
    let effectOptions = this.effect.options ?? {};

    switch (this.effect.type) {
      case "feat":
        effect = baseFeatEffect(this.document, name, effectOptions);
        break;
      case "spell":
        effect = baseSpellEffect(this.document, name, effectOptions);
        break;
      case "monster":
        effect = baseMonsterFeatureEffect(this.document, name, effectOptions);
        break;
      case "item":
        effect = baseItemEffect(this.document, name, effectOptions);
        break;
      case "basic":
      default:
        effect = baseEffect(this.document, name, effectOptions);
    }

    if (this.effect.data) {
      effect = foundry.utils.mergeObject(effect, this.effect.data);
    }

    if (this.effect?.func) {
      this.effect.func(effect);
    }

    return effect;
  }

  addDocumentOverride() {
    if (!this.override) return this.document;
    this.document = foundry.utils.mergeObject(this.document, this.override.data);
    return this.document;
  }

}
