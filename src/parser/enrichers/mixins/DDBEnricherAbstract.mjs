import DICTIONARY from "../../../dictionary.js";
import DDBEffectHelper from "../../../effects/DDBEffectHelper.js";
import { addMagicalBonusToEnchantmentEffect, addStatusEffectChange, baseEffect, baseEnchantmentEffect, baseItemEffect, effectModules, forceItemEffect } from "../../../effects/effects.js";
import { baseFeatEffect } from "../../../effects/specialFeats.js";
import { baseMonsterFeatureEffect } from "../../../effects/specialMonsters.js";
import { baseSpellEffect } from "../../../effects/specialSpells.js";
import DDBHelper from "../../../lib/DDBHelper.js";
import utils from "../../../lib/utils.js";
import logger from "../../../logger.js";
import DDBSummonsManager from "../../companions/DDBSummonsManager.js";

export default class DDBEnricherAbstract {

  static allDamageTypes(exclude = []) {
    return DICTIONARY.actions.damageType
      .filter((d) => d.name !== null)
      .map((d) => d.name)
      .filter((d) => !exclude.includes(d));
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

  DND_2014 = {
    ACTIVITY_HINTS: {},
    ADDITIONAL_ACTIVITIES: {},
    DOCUMENT_OVERRIDES: {},
    EFFECT_HINTS: {},
    DOCUMENT_STUB: {},
  };

  NAME_HINTS_2014 = {};

  NAME_HINTS = {};

  ACTIVITY_HINTS = {};

  ADDITIONAL_ACTIVITIES = {};

  DOCUMENT_OVERRIDES = {};

  EFFECT_HINTS = {};

  DOCUMENT_STUB = {};

  ENRICHERS = {};

  static _loadDataStub(stub) {
    return utils.isFunction(stub) ? stub() : stub;
  }

  _loadEnricherData(name) {
    if (this.ENRICHERS?.[name]) {
      const ExternalEnricher = DDBEnricherAbstract._loadDataStub(this.ENRICHERS?.[name]);
      return new ExternalEnricher({
        ddbEnricher: this,
      });
    }
    return null;
  }

  _getEnricherMatchesV2() {
    const loadedEnricher = this._loadEnricherData(this.hintName);
    if (!loadedEnricher) return;
    this.loadedEnricher = loadedEnricher;
  }

  _findEnricherMatch(type) {
    const match2014 = this.is2014
      ? this.DND_2014[type]?.[this.hintName]
      : null;
    const match = match2014 ?? this[type]?.[this.hintName];

    const loadedMatch = DDBEnricherAbstract._loadDataStub(match);
    if (!loadedMatch) return null;

    if (loadedMatch.lookupName && this.ddbParser) {
      const lookupName = foundry.utils.getProperty(this.ddbParser, "lookupName");
      if (loadedMatch?.lookupName[lookupName]) {
        this.useLookupName = true;
        return DDBEnricherAbstract._loadDataStub(loadedMatch.lookupName[lookupName]);
      }
    }
    return loadedMatch;
  }


  _prepare() {
    if (this.isCustomAction) return;
    this.hintName = (this.is2014 ? this.NAME_HINTS_2014[this.name] : null)
      ?? this.NAME_HINTS[this.name]
      ?? this.name;

    this._getEnricherMatchesV2();
  }

  get type() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.type;
    } else {
      return null;
    }
  }

  get activity() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.activity;
    } else {
      const rawActivity = this._findEnricherMatch("ACTIVITY_HINTS");
      return utils.isFunction(rawActivity) ? rawActivity() : rawActivity;
    }
  }

  get effects() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.effects;
    } else {
      const rawEffect = this._findEnricherMatch("EFFECT_HINTS");
      const effectHintsRaw = utils.isFunction(rawEffect)
        ? rawEffect()
        : rawEffect;
      return [effectHintsRaw];
    }
  }

  get override() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.override;
    } else {
      const rawOverride = this._findEnricherMatch("DOCUMENT_OVERRIDES");

      return utils.isFunction(rawOverride)
        ? rawOverride()
        : rawOverride;
    }
  }

  get additionalActivities() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.additionalActivities;
    } else {
      const rawAdditionalActivities = this._findEnricherMatch("ADDITIONAL_ACTIVITIES");

      return utils.isFunction(rawAdditionalActivities)
        ? rawAdditionalActivities()
        : rawAdditionalActivities;
    }
  }

  get documentStub() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.documentStub;
    } else {
      return this._findEnricherMatch("DOCUMENT_STUB");
    }
  }

  get clearAutoEffects() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.clearAutoEffects;
    } else {
      return this._findEnricherMatch("EFFECT_HINTS")?.clearAutoEffects ?? false;
    }
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
    this.manager = null;
    this.loadedEnricher = null;
    this._originalActivity = null;
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

  get originalActivity() {
    return this._originalActivity;
  }

  set originalActivity(activity) {
    this._originalActivity = activity;
  }

  // eslint-disable-next-line complexity
  _applyActivityDataOverride(activity, overrideData) {
    if (overrideData.name) activity.name = overrideData.name;

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
        target: overrideData.itemConsumeTargetName ?? "",
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
    if (overrideData.addSpellSlotConsume) {
      if (!foundry.utils.getProperty(activity, "consumption.targets"))
        foundry.utils.setProperty(activity, "consumption.targets", []);
      activity.consumption.targets.push({
        type: "spellSlots",
        target: "",
        value: overrideData.spellSlotConsumeValue ?? "1",
        scaling: {
          mode: overrideData.addSpellSlotScalingMode ?? "",
          formula: overrideData.addSpellSlotScalingFormula ?? "",
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
      foundry.utils.setProperty(this.data, "flags.midi-qol.reactionCondition", "false");

    if (foundry.utils.hasProperty(overrideData, "flatAttack")) {
      foundry.utils.setProperty(activity, "attack.bonus", overrideData.flatAttack);
      foundry.utils.setProperty(activity, "attack.flat", true);
    }

    if (overrideData.damageParts) {
      activity.damage.parts = activity.damage.parts.concat(overrideData.damageParts);
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

    if (overrideData.type === "summon" && this.manager) {
      this.manager.addProfilesToActivity(activity, overrideData.profileKeys, overrideData.summons);
    }

    if (overrideData.noeffect) {
      const ids = foundry.utils.getProperty(this.data, "flags.ddbimporter.noeffect") ?? [];
      ids.push(this.data._id);
      foundry.utils.setProperty(this.data, "flags.ddbimporter.noEffectIds", ids);
      foundry.utils.setProperty(activity, "flags.ddbimporter.noeffect", true);
    }

    return activity;
  }

  applyActivityOverride(activityData) {
    this.originalActivity = activityData;
    const activity = this.activity;
    if (!activity) return activityData;

    return this._applyActivityDataOverride(activityData, activity);
  }

  // eslint-disable-next-line complexity
  createEffect() {
    const effects = [];
    if (!this.effects || this.effects?.length === 0) return effects;

    for (const effectHintFunction of this.effects) {
      const effectHint = utils.isFunction(effectHintFunction)
        ? effectHintFunction()
        : effectHintFunction;
      if (!effectHint) continue;
      if (effectHint.midiOnly && !effectModules().midiQolInstalled) continue;
      let name = effectHint.name ?? this.name;
      let effectOptions = effectHint.options ?? {};

      let effect;
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

      if (effectHint.activityMatch) {
        foundry.utils.setProperty(effect, "flags.ddbimporter.activityMatch", effectHint.activityMatch);
      }

      if (effectHint.activitiesMatch) {
        foundry.utils.setProperty(effect, "flags.ddbimporter.activitiesMatch", effectHint.activitiesMatch);
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
    const override = this.override;

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

    if (override.replaceActivityUses) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.replaceActivityUses", true);
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

  _buildActivitiesFromAction({ name, type, isAttack = null, rename = null }, y) {
    const result = {
      activities: {},
      effects: [],
    };
    if (!this.ddbParser?.ddbCharacter) return result;
    const actions = this.ddbParser.ddbCharacter._characterFeatureFactory.getActions({ name, type });
    if (actions.length === 0) return result;
    const actionFeatures = actions.map((action) => {
      return this.ddbParser.ddbCharacter._characterFeatureFactory.getFeatureFromAction({
        action,
        isAttack,
        manager: this.manager,
      });
    });
    actionFeatures.forEach((feature, i) => {
      for (const activityKey of (Object.keys(feature.system.activities))) {
        let newKey = `${activityKey.slice(0, -3)}Ne${y + i}`;
        while (result.activities[newKey] || this.data.system.activities[newKey]) {
          newKey = `${activityKey.slice(0, -3)}Ne${y + i + 1}`;
        }
        result.activities[newKey] = foundry.utils.deepClone(feature.system.activities[activityKey]);
        result.activities[newKey]._id = `${newKey}`;
        if (rename) {
          foundry.utils.setProperty(result.activities[newKey], "name", (rename[i] ?? ""));
        }
      }
      result.effects.push(...(foundry.utils.deepClone(feature.effects)));
    });
    logger.debug(`Additional Activities from Action ${name}`, { result });
    return result;
  }

  addAdditionalActivities(ddbParent) {
    const additionalActivities = this.additionalActivities;
    if (!additionalActivities || !this.additionalActivityClass) return;

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
        logger.debug(`Building activity from action ${actionActivity.name}`, { actionActivity, i });
        const result = this._buildActivitiesFromAction(actionActivity, i);
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
          this.originalActivity = activity;
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
