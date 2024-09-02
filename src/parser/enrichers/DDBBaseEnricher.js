import { baseEffect, baseItemEffect } from "../../effects/effects.js";
import { baseFeatEffect } from "../../effects/specialFeats.js";
import { baseMonsterFeatureEffect } from "../../effects/specialMonsters.js";
import { baseSpellEffect } from "../../effects/specialSpells.js";

export default class DDBBaseEnricher {
  NAME_HINTS = {};

  ACTIVITY_HINTS = {};

  ADDITIONAL_ACTIVITIES = {};

  DOCUMENT_OVERRIDES = {};

  EFFECT_HINTS = {};

  DOCUMENT_STUB = {};

  _prepare() {
    this.hintName = this.NAME_HINTS[this.name] ?? this.name;
    this.activity = this.ACTIVITY_HINTS[this.hintName];
    this.effect = this.EFFECT_HINTS[this.hintName];
    this.override = this.DOCUMENT_OVERRIDES[this.hintName];
    this.additionalActivities = this.ADDITIONAL_ACTIVITIES[this.hintName];
    this.documentStub = this.DOCUMENT_STUB[this.hintName];
  }

  constructor({ document, name = null } = {}) {
    this.document = document;
    this.name = name ?? document.flags?.ddbimporter?.originalName ?? document.name;
    this.additionalActivityClass = null;
    this._prepare();
  }

  applyActivityOverride(activity) {
    // console.warn(`applyActivityOverride for ${this.document.name}`, {
    //   activity,
    //   this: this,
    // });
    if (!this.activity) return activity;

    if (this.activity.parent) {
      for (const parent of this.activity.parent) {
        const lookupName = foundry.utils.getProperty(this.document, "flags.ddbimporter.dndbeyond.lookupName");
        if (lookupName !== parent.lookupName) continue;

        const base = foundry.utils.deepClone(this.activity);
        delete base.parent;
        this.activity = foundry.utils.mergeObject(base, parent);
      }
    }

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

    if (foundry.utils.hasProperty(this.activity, "flatAttack")) {
      foundry.utils.setProperty(activity, "attack.bonus", this.activity.flatAttack);
      foundry.utils.setProperty(activity, "attack.flat", true);
    }

    if (this.activity.data) {
      activity = foundry.utils.mergeObject(activity, this.activity.data);
    }

    if (this.activity.func) this.activity.func(activity);

    // console.warn(`applyActivityOverride finished for ${this.document.name}`, {
    //   activity: foundry.utils.deepClone(activity),
    //   this: this,
    //   thisActivity: foundry.utils.deepClone(this.activity),
    // });

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

  addAdditionalActivities(ddbParent) {
    if (!this.additionalActivities || !this.additionalActivityClass) return;

    for (const data of this.additionalActivities) {
      const activity = new this.additionalActivityClass(foundry.utils.mergeObject(data.constructor, {
        ddbParent: ddbParent,
        nameIdPrefix: "add",
        nameIdPostfix: `${this.document.system.activities.length + 1}`,
      }));
      activity.build(data.build);
      // console.warn("addAdditionalActivities", {
      //   activity,
      //   this: this,
      //   data,
      // });
      this.document.system.activities[activity.data._id] = activity.data;
    }
  }


}
