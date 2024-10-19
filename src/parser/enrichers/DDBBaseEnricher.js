import DICTIONARY from "../../dictionary.js";
import DDBEffectHelper from "../../effects/DDBEffectHelper.js";
import { addMagicalBonusToEnchantmentEffect, addStatusEffectChange, baseEffect, baseEnchantmentEffect, baseItemEffect, effectModules, forceItemEffect } from "../../effects/effects.js";
import { baseFeatEffect } from "../../effects/specialFeats.js";
import { baseMonsterFeatureEffect } from "../../effects/specialMonsters.js";
import { baseSpellEffect } from "../../effects/specialSpells.js";
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import DDBSummonsManager from "../companions/DDBSummonsManager.js";

export default class DDBBaseEnricher {

  static allDamageTypes() {
    return DICTIONARY.actions.damageType.filter((d) => d.name !== null).map((d) => d.name);
  }

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

  EXTERNAL_ENRICHERS = {};

  static _loadDataStub(stub) {
    return utils.isFunction(stub) ? stub() : stub;
  }

  _loadEnricherData(name) {
    if (this.EXTERNAL_ENRICHERS?.[name]) {
      const ExternalEnricher = DDBBaseEnricher._loadDataStub(this.EXTERNAL_ENRICHERS?.[name]);
      return new ExternalEnricher({
        ddbEnricher: this,
      });
    }
    return null;
  }

  _getEnricherMatchesV2() {

    const loadedMatch = this._loadEnricherData(this.hintName);

    if (!loadedMatch) return null;

    this.activity = loadedMatch.activity;
    this.effect = loadedMatch.effect;
    this.override = loadedMatch.override;
    this.additionalActivities = loadedMatch.additionalActivities;
    this.documentStub = loadedMatch.documentStub;
    return true;
  }

  _findEnricherMatch(type) {
    const match2014 = this.is2014
      ? this.DND_2014[type]?.[this.hintName]
      : null;
    const match = match2014 ?? this[type]?.[this.hintName];

    const loadedMatch = DDBBaseEnricher._loadDataStub(match);
    if (!loadedMatch) return null;

    if (loadedMatch.lookupName && this.ddbParser) {
      const lookupName = foundry.utils.getProperty(this.ddbParser, "lookupName");
      if (loadedMatch?.lookupName[lookupName]) {
        this.useLookupName = true;
        return DDBBaseEnricher._loadDataStub(loadedMatch.lookupName[lookupName]);
      }
    }
    return loadedMatch;


    // lookupName
  }

  _getEnricherMatchesV1() {
    this.activity = this._findEnricherMatch("ACTIVITY_HINTS");
    this.effect = this._findEnricherMatch("EFFECT_HINTS");
    this.override = this._findEnricherMatch("DOCUMENT_OVERRIDES");
    this.additionalActivities = this._findEnricherMatch("ADDITIONAL_ACTIVITIES");
    this.documentStub = this._findEnricherMatch("DOCUMENT_STUB");
  }

  _prepare() {
    if (this.isCustomAction) return;
    this.hintName = (this.is2014 ? this.DND_2014.NAME_HINTS[this.name] : null)
      ?? this.NAME_HINTS[this.name]
      ?? this.name;

    const loadV2 = this._getEnricherMatchesV2();
    if (!loadV2) this._getEnricherMatchesV1();
  }

  constructor() {
    this.ddbParser = null;
    this.document = null;
    this.name = null;
    this.isCustomAction = null;
    this.additionalActivityClass = null;
    this.is2014 = null;
    this.is2024 = null;
    this.useLookupName = false;
    this.effectType = "basic";
    this.enricherType = "general";
  }

  load({ ddbParser, document, name = null, is2014 = null } = {}) {
    this.ddbParser = ddbParser;
    this.document = ddbParser?.data ?? document;
    this.name = ddbParser?.originalName ?? name ?? document.flags?.ddbimporter?.originalName ?? document.name;
    this.isCustomAction = this.document.flags?.ddbimporter?.isCustomAction;
    this.is2014 = is2014 ?? this.ddbParser?.is2014 ?? this.document.flags?.ddbimporter?.is2014 ?? false;
    this.is2024 = !this.is2014;
    this.useLookupName = false;
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
  _applyActivityDataOverride(activity, overrideData) {
    if (overrideData.name) activity.name = overrideData.name;

    if (overrideData.type === "summon") {
      if (!this.manager) return activity;
      this.manager.addProfilesToActivity(activity, overrideData.profileKeys, overrideData.summons);
    }

    if (overrideData.parent) {
      for (const parent of overrideData.parent) {
        const lookupName = foundry.utils.getProperty(this.data, "flags.ddbimporter.dndbeyond.lookupName");
        if (lookupName !== parent.lookupName) continue;

        const base = foundry.utils.deepClone(overrideData);
        delete base.parent;
        overrideData = foundry.utils.mergeObject(base, parent);
      }
    }

    if (overrideData.noConsumeTargets) {
      foundry.utils.setProperty(activity, "consumption.targets", []);
    }
    if (overrideData.addItemConsume) {
      foundry.utils.setProperty(activity, "consumption.targets", []);
      activity.consumption.targets.push({
        type: "itemUses",
        target: "",
        value: overrideData.itemConsumeValue ?? "1",
        scaling: {
          mode: overrideData.addScalingMode ?? "",
          formula: overrideData.addScalingFormula ?? "",
        },
      });
    }
    if (overrideData.addActivityConsume) {
      if (!foundry.utils.getProperty(activity, "consumption.targets"))
        foundry.utils.setProperty(activity, "consumption.targets", []);
      activity.consumption.targets.push({
        type: "activityUses",
        target: "",
        value: overrideData.activityConsumeValue ?? "1",
        scaling: {
          mode: overrideData.addActivityScalingMode ?? "",
          formula: overrideData.addActivityScalingFormula ?? "",
        },
      });
    }

    if (overrideData.additionalConsumptionTargets) {
      activity.consumption.targets.push(...overrideData.additionalConsumptionTargets);
    }

    if (overrideData.addConsumptionScalingMax !== undefined) {
      foundry.utils.setProperty(activity, "consumption.scaling", {
        allowed: true,
        max: overrideData.addConsumptionScalingMax,
      });
    }

    if (overrideData.targetType) {
      if (activity.target?.affects)
        foundry.utils.setProperty(activity, "target.affects.type", overrideData.targetType);
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
            type: overrideData.targetType,
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

    if (overrideData.rangeSelf) {
      foundry.utils.setProperty(activity, "range", {
        value: null,
        units: "self",
        special: "",
      });
    }

    if (overrideData.noTemplate) {
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

    if (overrideData.overrideTemplate)
      foundry.utils.setProperty(activity, "target.override", true);

    if (overrideData.overrideRange)
      foundry.utils.setProperty(activity, "range.override", true);

    if (overrideData.activationType) {
      activity.activation = {
        type: overrideData.activationType,
        value: activity.activation?.value ?? overrideData.activationValue ?? 1,
        condition: activity.activation?.condition ?? "",
      };
    } else if (overrideData.activationValue) {
      foundry.utils.setProperty(activity, "activation.value", overrideData.activationValue);
    }
    if (overrideData.activationCondition) {
      foundry.utils.setProperty(activity, "activation.condition", overrideData.activationCondition);
    }

    if (overrideData.overrideActivation)
      foundry.utils.setProperty(activity, "activation.override", true);

    if (overrideData.midiManualReaction && effectModules().midiQolInstalled)
      foundry.utils.setProperty(activity, "activation.type", "reactionmanual");

    if (foundry.utils.hasProperty(overrideData, "flatAttack")) {
      foundry.utils.setProperty(activity, "attack.bonus", overrideData.flatAttack);
      foundry.utils.setProperty(activity, "attack.flat", true);
    }

    if (overrideData.damageParts) {
      const parts = [];
      for (const part of overrideData.damageParts) {
        parts.push(activity.damage.parts[part]);
      }
      activity.damage.parts = parts;
    }

    if (overrideData.data) {
      const data = utils.isFunction(overrideData.data)
        ? overrideData.data()
        : overrideData.data;
      activity = foundry.utils.mergeObject(activity, data);
    }

    if (overrideData.func) overrideData.func(activity);

    if (overrideData.allowMagical) {
      activity.restrictions.allowMagical = true;
    }

    return activity;
  }

  applyActivityOverride(activity) {
    if (!this.activity) return activity;

    let activityHint = utils.isFunction(this.activity) ? this.activity() : this.activity;

    if (!activityHint) return activity;

    return this._applyActivityDataOverride(activity, activityHint);
  }

  // eslint-disable-next-line complexity
  createEffect() {
    const effects = [];
    if (!this.effect) return effects;

    let effect;

    const effectHintsRaw = utils.isFunction(this.effect)
      ? this.effect()
      : this.effect;

    if (!effectHintsRaw) return effects;

    const effectHints = effectHintsRaw.multiple
      ? utils.isFunction(effectHintsRaw.multiple)
        ? effectHintsRaw.multiple()
        : effectHintsRaw.multiple
      : [effectHintsRaw];

    for (const effectHintFunction of effectHints) {
      const effectHint = utils.isFunction(effectHintFunction)
        ? effectHintFunction()
        : effectHintFunction;
      if (!effectHint) continue;
      let name = effectHint.name ?? this.name;
      let effectOptions = effectHint.options ?? {};

      if (effectHint.noCreate && this.data.effects.length > 0) {
        effect = this.data.effects[0];
      } else {
        switch (effectHint.type ?? this.effectType) {
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

        if (!effectOptions.durationSeconds && !effectOptions.durationRounds) {
          const duration = DDBEffectHelper.getDuration(this.data.system.description.value, false);
          if (duration.type) {
            foundry.utils.setProperty(effect, "duration.seconds", duration.second);
            foundry.utils.setProperty(effect, "duration.rounds", duration.round);
          }
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

      if (effectHint.midiChanges && effectModules().midiQolInstalled) {
        effect.changes.push(...effectHint.midiChanges);
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

  _buildAdditionalActivityFromDDBParent(activityHint, i, ddbParent) {
    const activationData = foundry.utils.mergeObject({
      nameIdPrefix: "add",
      nameIdPostfix: `${i}`,
    }, activityHint.constructor);
    activationData.ddbParent = ddbParent;
    const activity = new this.additionalActivityClass(activationData);
    activity.build(activityHint.build);

    return {
      activities: {
        [activity.data._id]: activity.data,
      },
      effects: [],
    };
  }

  _buildActivitiesFromAction({ name, type, isAttack = null, rename = null }) {
    const result = {
      activities: {},
      effects: [],
    };
    if (!this.ddbParser?.ddbData) return result;
    const actions = this.ddbParser.ddbCharacter._characterFeatureFactory.getActions({ name, type });
    // console.warn("actions", { name, type, actions, this: this });
    if (actions.length === 0) return result;
    const actionFeatures = actions.map((action) => {
      return this.ddbParser.ddbCharacter._characterFeatureFactory.getFeatureFromAction({
        action,
        isAttack,
      });
    });
    actionFeatures.forEach((feature, i) => {
      for (const activityKey of (Object.keys(feature.system.activities))) {
        result.activities[activityKey] = foundry.utils.deepClone(feature.system.activities[activityKey]);
        if (rename) {
          foundry.utils.setProperty(result.activities[activityKey], "name", (rename[i] ?? ""));
        }
      }
      result.effects.push(...(foundry.utils.deepClone(feature.effects)));
    });
    return result;
  }

  addAdditionalActivities(ddbParent) {
    if (!this.additionalActivities || !this.additionalActivityClass) return;

    const additionalActivities = utils.isFunction(this.additionalActivities)
      ? this.additionalActivities()
      : this.additionalActivities;

    if (!additionalActivities) return;

    let i = this.data.system.activities.length ?? 0 + 1;
    for (const activityHint of additionalActivities) {
      const actionActivity = foundry.utils.getProperty(activityHint, "action");
      const duplicate = foundry.utils.getProperty(activityHint, "duplicate");
      const activityData = {
        activities: {},
        effects: [],
      };

      if (duplicate) {
        const key = Object.keys(this.data.system.activities)[0];
        const activityClone = foundry.utils.deepClone(this.data.system.activities[key]);
        activityClone._id = `${activityClone._id.slice(0, -3)}clo`;
        activityData.activities = [activityClone];
      } else if (actionActivity) {
        const result = this._buildActivitiesFromAction(actionActivity);
        activityData.activities = result.activities;
        activityData.effects = result.effects;
      } else {
        const result = this._buildAdditionalActivityFromDDBParent(activityHint, i, ddbParent);
        activityData.activities = result.activities;
        activityData.effects = result.effects;
      }

      // console.warn("Activities", activityData);
      for (let activity of Object.values(activityData.activities)) {
        // console.warn("Activity", activity);

        if (activityHint.overrides) {
          activity = this._applyActivityDataOverride(activity, activityHint.overrides);
        }

        this.data.system.activities[activity._id] = activity;
        i++;
      }
      if (activityData.effects) {
        this.data.effects.push(...activityData.effects);
      }
    }
  }

  _getSpentValue(type, name, matchSubClass = null) {
    const spent = this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      a.name === name
    && (matchSubClass === null
      || DDBHelper.findSubClassByFeatureId(this.ddbParser.ddbData, a.componentId) === matchSubClass),
    )?.limitedUse?.numberUsed ?? null;
    return spent;
  }

  _getUsesWithSpent({ type, name, max, period = "", formula = null, override = null, matchSubClass = null } = {}) {
    const uses = {
      spent: this._getSpentValue(type, name, matchSubClass),
      max,
    };

    if (formula) {
      uses.recovery = [{ period, type: "formula", formula }];
    } else if (period != "") {
      uses.recovery = [{ period, type: 'recoverAll', formula: undefined }];
    }

    if (override) {
      uses.override = true;
    }

    return uses;
  }

}
