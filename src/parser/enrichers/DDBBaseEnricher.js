import { addMagicalBonusToEnchantmentEffect, baseEffect, baseEnchantmentEffect, baseItemEffect } from "../../effects/effects.js";
import { baseFeatEffect } from "../../effects/specialFeats.js";
import { baseMonsterFeatureEffect } from "../../effects/specialMonsters.js";
import { baseSpellEffect } from "../../effects/specialSpells.js";

export default class DDBBaseEnricher {

  static basicDamagePart({
    number = null, denomination = null, type = null, bonus = "", scalingMode = "whole",
    scalingNumber = 1, scalingFormula = "",
  } = {}) {
    return {
      number,
      denomination,
      bonus,
      types: type ? [type] : [],
      custom: {
        enabled: false,
        formula: "",
      },
      scaling: {
        mode: scalingMode, // whole, half or ""
        number: scalingNumber,
        formula: scalingFormula,
      },
    };
  }

  DND_2014 = {
    NAME_HINTS: {},
    ACTIVITY_HINTS: {},
    ADDITIONAL_ACTIVITIES: {},
    DOCUMENT_OVERRIDES: {},
    EFFECT_HINTS: {},
    DOCUMENT_STUB: {},
  };

  NAME_HINTS = {};

  ACTIVITY_HINTS = {};

  ADDITIONAL_ACTIVITIES = {};

  DOCUMENT_OVERRIDES = {};

  EFFECT_HINTS = {};

  DOCUMENT_STUB = {};

  _prepare() {
    this.hintName = (this.is2014 ? this.DND_2014.NAME_HINTS[this.name] : null) ?? this.NAME_HINTS[this.name] ?? this.name;
    this.activity = (this.is2014 ? this.DND_2014.ACTIVITY_HINTS[this.name] : null) ?? this.ACTIVITY_HINTS[this.hintName];
    this.effect = (this.is2014 ? this.DND_2014.EFFECT_HINTS[this.name] : null) ?? this.EFFECT_HINTS[this.hintName];
    this.override = (this.is2014 ? this.DND_2014.DOCUMENT_OVERRIDES[this.name] : null) ?? this.DOCUMENT_OVERRIDES[this.hintName];
    this.additionalActivities = (this.is2014 ? this.DND_2014.ADDITIONAL_ACTIVITIES[this.name] : null) ?? this.ADDITIONAL_ACTIVITIES[this.hintName];
    this.documentStub = (this.is2014 ? this.DND_2014.DOCUMENT_STUB[this.name] : null) ?? this.DOCUMENT_STUB[this.hintName];
  }

  constructor({ ddbParser, document, name = null, is2014 = null } = {}) {
    this.ddbParser = ddbParser;
    this.document = ddbParser?.data ?? document;
    this.name = ddbParser?.originalName ?? name ?? document.flags?.ddbimporter?.originalName ?? document.name;
    this.additionalActivityClass = null;
    this.is2014 = is2014 ?? this.ddbParser?.is2014 ?? this.document.flags?.ddbimporter?.is2014 ?? false;
    this._prepare();
    // to do refactor for 2014/2024 data sets
  }

  get data() {
    return this.ddbParser?.data ?? this.document;
  }

  set data(data) {
    if (this.ddbParser?.data) this.ddbParser.data = data;
    else if (this.document) this.document = data;
  }

  // eslint-disable-next-line complexity
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

    if (this.activity.targetType) {
      if (activity.target?.affects)
        foundry.utils.setProperty(activity, "target.affects.type", "self");
      else {
        foundry.utils.setProperty(activity, "target", {
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
            type: "self",
            choice: false,
            special: "",
          },
          prompt: true,
        });
      }
      foundry.utils.setProperty(activity, "range", {
        value: null,
        units: "self",
        special: "",
      });
    }

    if (this.activity.activationType) {
      activity.activation = {
        type: this.activity.activationType,
        value: activity.activation?.value ?? this.activity.activationValue ?? 1,
        condition: activity.activation?.condition ?? "",
      };
    } else if (this.activity.activationValue) {
      foundry.utils.setProperty(activity, "activation.value", this.activity.activationValue);
    }
    if (this.activity.activationCondition) {
      foundry.utils.setProperty(activity, "activation.condition", this.activity.activationCondition);
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
