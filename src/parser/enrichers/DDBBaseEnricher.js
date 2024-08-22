import { baseEffect, baseItemEffect } from "../../effects/effects.js";
import { baseFeatEffect } from "../../effects/specialFeats.js";
import { baseMonsterFeatureEffect } from "../../effects/specialMonsters.js";
import { baseSpellEffect } from "../../effects/specialSpells.js";

export default class DDBBaseEnricher {
  NAME_HINTS = {};

  ACTIVITY_HINTS = {};

  DOCUMENT_OVERRIDES = {};

  EFFECT_HINTS = {};

  _prepare() {
    this.hintName = this.NAME_HINTS[this.name] ?? this.name;
    this.activity = this.ACTIVITY_HINTS[this.hintName];
    this.effect = this.EFFECT_HINTS[this.hintName];
    this.override = this.DOCUMENT_OVERRIDES[this.hintName];
  }

  constructor({ document, name = null } = {}) {
    this.document = document;
    this.name = name ?? document.flags?.ddbimporter?.originalName ?? document.name;
    this._prepare();
  }

  applyActivityOverride(activity) {
    if (!this.activity) return activity;

    if (this.activity.addItemConsume) {
      foundry.utils.setProperty(activity, "consumption.targets", [
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ]);
    }

    if (this.activity.targetSelf) {
      foundry.utils.setProperty(activity, "target.affects.type", "self");
      foundry.utils.setProperty(activity, "range", {
        value: null,
        units: "self",
        special: "",
      });
    }

    if (this.activity.specialActivation) {
      foundry.utils.setProperty(activity, "activation", {
        type: "special",
        value: 1,
        condition: "",
      });
    }

    if (this.activity.data) {
      activity = foundry.utils.mergeObject(activity, this.activity.data);
    }

    if (this.activity.func) this.activity.func(activity);

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
    if (this.override.removeDamage) {
      this.document.system.damage = {
        number: null,
        denomination: null,
        bonus: "",
        types: [],
        custom: {
          enabled: false,
          formula: "",
        },
        scaling: {
          mode: "whole",
          number: null,
          formula: "",
        },
      };
    }

    if (this.override.data) this.document = foundry.utils.mergeObject(this.document, this.override.data);
    return this.document;
  }
}
