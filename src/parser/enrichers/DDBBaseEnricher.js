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

  static _loadDataStub(stub) {
    return utils.isFunction(stub) ? stub() : stub;
  }

  _prepare() {
    if (this.isCustomAction) return;
    this.hintName = (this.is2014 ? this.DND_2014.NAME_HINTS[this.name] : null) ?? this.NAME_HINTS[this.name] ?? this.name;
    this.activity = DDBBaseEnricher._loadDataStub((this.is2014 ? this.DND_2014.ACTIVITY_HINTS[this.hintName] : null) ?? this.ACTIVITY_HINTS[this.hintName]);
    this.effect = DDBBaseEnricher._loadDataStub((this.is2014 ? this.DND_2014.EFFECT_HINTS[this.hintName] : null) ?? this.EFFECT_HINTS[this.hintName]);
    this.override = DDBBaseEnricher._loadDataStub((this.is2014 ? this.DND_2014.DOCUMENT_OVERRIDES[this.hintName] : null) ?? this.DOCUMENT_OVERRIDES[this.hintName]);
    this.additionalActivities = (this.is2014 ? this.DND_2014.ADDITIONAL_ACTIVITIES[this.hintName] : null) ?? this.ADDITIONAL_ACTIVITIES[this.hintName];
    this.documentStub = DDBBaseEnricher._loadDataStub((this.is2014 ? this.DND_2014.DOCUMENT_STUB[this.hintName] : null) ?? this.DOCUMENT_STUB[this.hintName]);
  }

  constructor() {
    this.ddbParser = null;
    this.document = null;
    this.name = null;
    this.isCustomAction = null;
    this.additionalActivityClass = null;
    this.is2014 = null;
  }

  load({ ddbParser, document, name = null, is2014 = null } = {}) {
    this.ddbParser = ddbParser;
    this.document = ddbParser?.data ?? document;
    this.name = ddbParser?.originalName ?? name ?? document.flags?.ddbimporter?.originalName ?? document.name;
    this.isCustomAction = this.document.flags?.ddbimporter?.isCustomAction;
    this.is2014 = is2014 ?? this.ddbParser?.is2014 ?? this.document.flags?.ddbimporter?.is2014 ?? false;
    this._prepare();
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

    let activityHint = utils.isFunction(this.activity) ? this.activity() : this.activity;

    if (activityHint.type === "summon") {
      if (!this.manager) return activity;
      this.manager.addProfilesToActivity(activity, activityHint.profileKeys, activityHint.summons);
    }

    if (activityHint.parent) {
      for (const parent of activityHint.parent) {
        const lookupName = foundry.utils.getProperty(this.data, "flags.ddbimporter.dndbeyond.lookupName");
        if (lookupName !== parent.lookupName) continue;

        const base = foundry.utils.deepClone(activityHint);
        delete base.parent;
        activityHint = foundry.utils.mergeObject(base, parent);
      }
    }

    if (activityHint.noConsumeTargets) {
      foundry.utils.setProperty(activity, "consumption.targets", []);
    }
    if (activityHint.addItemConsume) {
      foundry.utils.setProperty(activity, "consumption.targets", [
        {
          type: "itemUses",
          target: "",
          value: activityHint.itemConsumeValue ?? "1",
          scaling: {
            mode: activityHint.addScalingMode ?? "",
            formula: activityHint.addScalingFormula ?? "",
          },
        },
      ]);
    }
    if (activityHint.addActivityConsume) {
      foundry.utils.setProperty(activity, "consumption.targets", [
        {
          type: "activityUses",
          target: "",
          value: activityHint.itemConsumeValue ?? "1",
          scaling: {
            mode: activityHint.addScalingMode ?? "",
            formula: activityHint.addScalingFormula ?? "",
          },
        },
      ]);
    }

    if (activityHint.targetType) {
      if (activity.target?.affects)
        foundry.utils.setProperty(activity, "target.affects.type", activityHint.targetType);
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
            type: activityHint.targetType,
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

    if (activityHint.noTemplate) {
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

    if (activityHint.overrideTemplate)
      foundry.utils.setProperty(activity, "target.override", true);

    if (activityHint.overrideRange)
      foundry.utils.setProperty(activity, "range.override", true);

    if (activityHint.activationType) {
      activity.activation = {
        type: activityHint.activationType,
        value: activity.activation?.value ?? activityHint.activationValue ?? 1,
        condition: activity.activation?.condition ?? "",
      };
    } else if (activityHint.activationValue) {
      foundry.utils.setProperty(activity, "activation.value", activityHint.activationValue);
    }
    if (activityHint.activationCondition) {
      foundry.utils.setProperty(activity, "activation.condition", activityHint.activationCondition);
    }

    if (activityHint.overrideActivation)
      foundry.utils.setProperty(activity, "activation.override", true);

    if (activityHint.midiManualReaction && effectModules().midiQolInstalled)
      foundry.utils.setProperty(activity, "activation.type", "reactionmanual");

    if (foundry.utils.hasProperty(activityHint, "flatAttack")) {
      foundry.utils.setProperty(activity, "attack.bonus", activityHint.flatAttack);
      foundry.utils.setProperty(activity, "attack.flat", true);
    }

    if (activityHint.damageParts) {
      const parts = [];
      for (const part of activityHint.damageParts) {
        parts.push(activity.damage.parts[part]);
      }
      activity.damage.parts = parts;
    }

    if (activityHint.data) {
      const data = utils.isFunction(activityHint.data)
        ? activityHint.data()
        : activityHint.data;
      activity = foundry.utils.mergeObject(activity, data);
    }

    if (activityHint.func) activityHint.func(activity);

    if (activityHint.allowMagical) {
      activity.restrictions.allowMagical = true;
    }

    return activity;
  }

  // eslint-disable-next-line complexity
  createEffect() {
    const effects = [];
    if (!this.effect) return effects;

    let effect;

    const effectHints = this.effect.multiple
      ? utils.isFunction(this.effect.multiple)
        ? this.effect.multiple()
        : this.effect.multiple
      : [this.effect];

    for (const effectHintFunction of effectHints) {
      const effectHint = utils.isFunction(effectHintFunction)
        ? effectHintFunction()
        : effectHintFunction;
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
      const activationData = foundry.utils.mergeObject(data.constructor, {
        nameIdPrefix: "add",
        nameIdPostfix: `${this.data.system.activities.length ?? 0 + 1}`,
      });
      activationData.ddbParent = ddbParent;
      const activity = new this.additionalActivityClass(activationData);
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
