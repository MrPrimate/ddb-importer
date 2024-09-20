import DDBEffectHelper from "../../effects/DDBEffectHelper.js";
import { addMagicalBonusToEnchantmentEffect, addStatusEffectChange, baseEffect, baseEnchantmentEffect, baseItemEffect, effectModules, forceItemEffect } from "../../effects/effects.js";
import { baseFeatEffect } from "../../effects/specialFeats.js";
import { baseMonsterFeatureEffect } from "../../effects/specialMonsters.js";
import { baseSpellEffect } from "../../effects/specialSpells.js";
import utils from "../../lib/utils.js";
import DDBSummonsManager from "../companions/DDBSummonsManager.js";

export default class DDBBaseEnricher {

  static basicDamagePart({
    number = null, denomination = null, type = null, types = [], bonus = "", scalingMode = "whole",
    scalingNumber = 1, scalingFormula = "", customFormula = null,
  } = {}) {
    return {
      number,
      denomination,
      bonus,
      types: type ? [type] : types,
      custom: {
        enabled: customFormula !== null,
        formula: customFormula,
      },
      scaling: {
        mode: scalingMode, // whole, half or ""
        number: scalingNumber,
        formula: scalingFormula,
      },
    };
  }

  hasClassFeature({ featureName, className = null, subClassName = null } = {}) {
    if (!this.ddbParser?.ddbData) return false;

    const result = this.ddbParser.ddbData.character.classes.some((klass) =>
      klass.classFeatures.some((feature) => feature.definition.name === featureName && klass.level >= feature.definition.requiredLevel)
      && ((className === null || klass.definition.name === className)
        && (subClassName === null || klass.subclassDefinition?.name === subClassName)),
    );

    return result;
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
    if (this.isCustomAction) return;
    this.hintName = (this.is2014 ? this.DND_2014.NAME_HINTS[this.name] : null) ?? this.NAME_HINTS[this.name] ?? this.name;
    this.activity = (this.is2014 ? this.DND_2014.ACTIVITY_HINTS[this.hintName] : null) ?? this.ACTIVITY_HINTS[this.hintName];
    this.effect = (this.is2014 ? this.DND_2014.EFFECT_HINTS[this.hintName] : null) ?? this.EFFECT_HINTS[this.hintName];
    this.override = (this.is2014 ? this.DND_2014.DOCUMENT_OVERRIDES[this.hintName] : null) ?? this.DOCUMENT_OVERRIDES[this.hintName];
    this.additionalActivities = (this.is2014 ? this.DND_2014.ADDITIONAL_ACTIVITIES[this.hintName] : null) ?? this.ADDITIONAL_ACTIVITIES[this.hintName];
    this.documentStub = (this.is2014 ? this.DND_2014.DOCUMENT_STUB[this.hintName] : null) ?? this.DOCUMENT_STUB[this.hintName];
  }

  constructor({ ddbParser, document, name = null, is2014 = null } = {}) {
    this.ddbParser = ddbParser;
    this.document = ddbParser?.data ?? document;
    this.name = ddbParser?.originalName ?? name ?? document.flags?.ddbimporter?.originalName ?? document.name;
    this.isCustomAction = this.document.flags?.ddbimporter?.isCustomAction;
    this.additionalActivityClass = null;
    this.is2014 = is2014 ?? this.ddbParser?.is2014 ?? this.document.flags?.ddbimporter?.is2014 ?? false;
    this._prepare();
    // to do refactor for 2014/2024 data sets
  }

  async init() {
    this.manager = new DDBSummonsManager();
    await this.manager.init();
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

    if (this.activity.type === "summon") {
      if (!this.manager) return activity;
      this.manager.addProfilesToActivity(activity, this.activity.profileKeys, this.activity.summons);
    }

    if (this.activity.parent) {
      for (const parent of this.activity.parent) {
        const lookupName = foundry.utils.getProperty(this.data, "flags.ddbimporter.dndbeyond.lookupName");
        if (lookupName !== parent.lookupName) continue;

        const base = foundry.utils.deepClone(this.activity);
        delete base.parent;
        this.activity = foundry.utils.mergeObject(base, parent);
      }
    }

    if (this.activity.noConsumeTargets) {
      foundry.utils.setProperty(activity, "consumption.targets", []);
    }
    if (this.activity.addItemConsume) {
      foundry.utils.setProperty(activity, "consumption.targets", [
        {
          type: "itemUses",
          target: "",
          value: this.activity.itemConsumeValue ?? "1",
          scaling: {
            mode: this.activity.addScalingMode ?? "",
            formula: this.activity.addScalingFormula ?? "",
          },
        },
      ]);
    }
    if (this.activity.addActivityConsume) {
      foundry.utils.setProperty(activity, "consumption.targets", [
        {
          type: "activityUses",
          target: "",
          value: this.activity.itemConsumeValue ?? "1",
          scaling: {
            mode: this.activity.addScalingMode ?? "",
            formula: this.activity.addScalingFormula ?? "",
          },
        },
      ]);
    }

    if (this.activity.targetType) {
      if (activity.target?.affects)
        foundry.utils.setProperty(activity, "target.affects.type", this.activity.targetType);
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
            type: this.activity.targetType,
            choice: false,
            special: "",
          },
          prompt: true,
        });
      }
      if ([undefined, null, ""].includes(foundry.utils.getProperty(activity, "range.units"))) {
        foundry.utils.setProperty(activity, "range", {
          value: null,
          units: "self",
          special: "",
        });
      }
    }

    if (this.activity.noTemplate) {
      foundry.utils.setProperty(activity, "target.template", {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      });
    }

    if (this.activity.overrideTemplate)
      foundry.utils.setProperty(activity, "target.override", true);

    if (this.activity.overrideRange)
      foundry.utils.setProperty(activity, "range.override", true);

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

    if (this.activity.overrideActivation)
      foundry.utils.setProperty(activity, "activation.override", true);

    if (foundry.utils.hasProperty(this.activity, "flatAttack")) {
      foundry.utils.setProperty(activity, "attack.bonus", this.activity.flatAttack);
      foundry.utils.setProperty(activity, "attack.flat", true);
    }

    if (this.activity.damageParts) {
      const parts = [];
      for (const part of this.activity.damageParts) {
        parts.push(activity.damage.parts[part]);
      }
      activity.damage.parts = parts;
    }

    if (this.activity.data) {
      const data = utils.isFunction(this.activity.data)
        ? this.activity.data()
        : this.activity.data;
      activity = foundry.utils.mergeObject(activity, data);
    }

    if (this.activity.func) this.activity.func(activity);

    if (this.activity.allowMagical) {
      activity.restrictions.allowMagical = true;
    }

    return activity;
  }

  // eslint-disable-next-line complexity
  createEffect() {
    const effects = [];
    if (!this.effect) return effects;

    let effect;

    const effectHints = this.effect.multiple ?? [this.effect];


    for (const effectHint of effectHints) {
      let name = effectHint.name ?? this.name;
      let effectOptions = effectHint.options ?? {};

      if (effectHint.noCreate) {
        effect = this.data.effects[0];
      } else {
        switch (effectHint.type) {
          case "enchant":
            effect = baseEnchantmentEffect(this.data, name, effectOptions);
            if (effectHint.magicalBonus) {
              addMagicalBonusToEnchantmentEffect({
                effect,
                nameAddition: effectHint.magicalBonus.name,
                bonus: effectHint.magicalBonus.bonus,
                bonusMode: effectHint.magicalBonus.mode,
                makeMagical: effectHint.magicalBonus.makeMagical,
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

        const duration = DDBEffectHelper.getDuration(this.data.system.description.value, false);
        if (duration.type) {
          foundry.utils.setProperty(effect, "duration.seconds", duration.second);
          foundry.utils.setProperty(effect, "duration.rounds", duration.round);
        }
      }

      if (effectHint.statuses) {
        for (const status of effectHint.statuses) {
          const splitStatus = status.split(":");
          addStatusEffectChange({
            effect,
            statusName: splitStatus[0],
            level: splitStatus.length > 1 ? splitStatus[1] : null,
          });
        }
      }

      if (effectHint.changes) {
        const changes = utils.isFunction(effectHint.changes)
          ? effectHint.changes(this.data)
          : effectHint.changes;
        if (effectHint.changesOverwrite) effect.changes = changes;
        else effect.changes.push(...changes);
      }

      if (effectHint.atlChanges && effectModules().atlInstalled) {
        effect.changes.push(...effectHint.atlChanges);
      }

      if (effectHint.tokenMagicChanges && effectModules().tokenMagicInstalled) {
        effect.changes.push(...effectHint.tokenMagicChanges);
      }

      if (effectHint.data) {
        effect = foundry.utils.mergeObject(effect, effectHint.data);
      }

      if (effectHint?.func) {
        effectHint.func(effect);
      }

      if (effectHint.descriptionHint && effectHint.type === "enchant") {
        this.data.system.description.value = `${this.data.system.description.value}
  <br>
  <section class="secret">
  <i>This feature provides an enchantment to help provide it's functionality.</i>
  </section>`;
      }

      if (effectHint.descriptionSuffix) {
        this.data.system.description.value += effectHint.descriptionSuffix;
        if (this.data.system.description.chat !== "") this.data.system.description.chat += effectHint.descriptionSuffix;
      }

      if (!effectHint.noCreate) effects.push(effect);
    }
    forceItemEffect(this.data);

    return effects;
  }

  addDocumentOverride() {
    const override = utils.isFunction(this.override)
      ? this.override()
      : this.override;

    if (!override) return this.data;
    if (override.removeDamage) {
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

    if (override.noTemplate) {
      foundry.utils.setProperty(this.data.system, "target.template", {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      });
    }

    if (override.data) this.data = foundry.utils.mergeObject(this.data, override.data);

    if (override.descriptionSuffix) {
      this.data.system.description.value += override.descriptionSuffix;
      if (this.data.system.description.chat !== "") this.data.system.description.chat += override.descriptionSuffix;
    }

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
