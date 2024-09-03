import { addMagicalBonusToEnchantmentEffect, baseEffect, baseEnchantmentEffect, baseItemEffect } from "../../effects/effects.js";
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

  constructor({ ddbParser, document, name = null } = {}) {
    this.ddbParser = ddbParser;
    this.document = ddbParser?.data ?? document;
    this.name = ddbParser?.originalName ?? name ?? document.flags?.ddbimporter?.originalName ?? document.name;
    this.additionalActivityClass = null;
    this._prepare();
  }

  get data() {
    return this.ddbParser?.data ?? this.document;
  }

  applyActivityOverride(activity) {
    if (!this.activity) return activity;

    if (this.activity.parent) {
      for (const parent of this.activity.parent) {
        const lookupName = foundry.utils.getProperty(this.data, "flags.ddbimporter.dndbeyond.lookupName");
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
    if (this.activity.addActivityConsume) {
      foundry.utils.setProperty(activity, "consumption.targets", [
        {
          type: "activityUses",
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

    if (this.activity.allowMagical) {
      activity.restrictions.allowMagical = true;
    }

    return activity;
  }

  createEffect() {
    if (!this.effect) return undefined;

    let effect;

    let name = this.effect.name ?? this.name;
    let effectOptions = this.effect.options ?? {};

    switch (this.effect.type) {
      case "enchant":
        effect = baseEnchantmentEffect(this.data, name, effectOptions);
        if (this.effect.magicalBonus) {
          addMagicalBonusToEnchantmentEffect({
            effect,
            nameAddition: this.effect.magicalBonus.name,
            bonus: this.effect.magicalBonus.bonus,
            bonusMode: this.effect.magicalBonus.mode,
            makeMagical: this.effect.magicalBonus.makeMagical,
          });
        }
        break;
      case "feat":
        effect = baseFeatEffect(this.data, name, effectOptions);
        break;
      case "spell":
        effect = baseSpellEffect(this.data, name, effectOptions);
        break;
      case "monster":
        effect = baseMonsterFeatureEffect(this.data, name, effectOptions);
        break;
      case "item":
        effect = baseItemEffect(this.data, name, effectOptions);
        break;
      case "basic":
      default:
        effect = baseEffect(this.data, name, effectOptions);
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
    if (!this.override) return this.data;
    if (this.override.removeDamage) {
      this.data.system.damage = {
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

    if (this.override.data) this.data = foundry.utils.mergeObject(this.data, this.override.data);
    return this.data;
  }

  addAdditionalActivities(ddbParent) {
    if (!this.additionalActivities || !this.additionalActivityClass) return;

    for (const data of this.additionalActivities) {
      const activity = new this.additionalActivityClass(foundry.utils.mergeObject(data.constructor, {
        ddbParent: ddbParent,
        nameIdPrefix: "add",
        nameIdPostfix: `${this.data.system.activities.length + 1}`,
      }));
      activity.build(data.build);

      if (data.overrides?.addActivityConsume) {
        foundry.utils.setProperty(activity.data, "consumption.targets", [
          {
            type: "activityUses",
            target: "",
            value: "1",
            scaling: {
              mode: "",
              formula: "",
            },
          },
        ]);
      }

      this.data.system.activities[activity.data._id] = activity.data;
    }
  }


}
