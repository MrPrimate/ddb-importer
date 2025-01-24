import { utils, logger, DDBMacros } from "../../../lib/_module.mjs";
import DDBSummonsManager from "../../companions/DDBSummonsManager.mjs";
import { DDBDataUtils, DDBDescriptions } from "../../lib/_module.mjs";
import { AutoEffects, EnchantmentEffects, MidiEffects, ChangeHelper } from "../effects/_module.mjs";

export default class DDBEnricherFactoryMixin {

  NAME_HINTS_2014 = {};

  NAME_HINT_2014_INCLUDES = {};

  NAME_HINTS = {};

  NAME_HINT_INCLUDES = {};

  ENRICHERS = {};

  FALLBACK_ENRICHERS = {};


  _loadEnricherData() {
    if (!this.ENRICHERS?.[this.hintName]) return null;
    return new this.ENRICHERS[this.hintName]({
      ddbEnricher: this,
    });
  }

  _loadFallbackEnricherData() {
    if (!this.fallbackEnricher) return;
    if (!this.FALLBACK_ENRICHERS[this.fallbackEnricher]) return;
    const loadedEnricher = new this.FALLBACK_ENRICHERS[this.fallbackEnricher]({
      ddbEnricher: this,
    });
    this.loadedEnricher = loadedEnricher;
  }

  _getEnricherMatches() {
    const loadedEnricher = this._loadEnricherData();
    if (!loadedEnricher) {
      this._loadFallbackEnricherData();
      return;
    }
    this.loadedEnricher = loadedEnricher;
  }

  _getNameHint() {
    if (this.isCustomAction) return;
    const fullHint = (this.is2014 ? this.NAME_HINTS_2014[this.name] : null)
      ?? this.NAME_HINTS[this.name];
    if (fullHint) {
      this.hintName = fullHint;
      return;
    }

    if (this.is2014) {
      const keys = Object.keys(this.NAME_HINT_2014_INCLUDES);
      const hint = keys.find((key) => this.name.includes(key));
      if (hint) {
        this.hintName = this.NAME_HINT_2014_INCLUDES[hint];
        return;
      }
    }

    const keys = Object.keys(this.NAME_HINT_INCLUDES);
    const hint = keys.find((key) => this.name.includes(key));
    if (hint) {
      this.hintName = this.NAME_HINT_INCLUDES[hint];
      return;
    }

    this.hintName = this.name;
  }

  async _prepare() {
    this._getNameHint();
    this._getEnricherMatches();
    if (!this.ddbParser.isAction) {
      await this._buildDefaultActionFeatures();
    }
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
      return null;
    }
  }

  get effects() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.effects;
    } else {
      return [];
    }
  }

  get override() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.override;
    } else {
      return null;
    }
  }

  get additionalActivities() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.additionalActivities;
    } else {
      return [];
    }
  }

  get useDefaultAdditionalActivities() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.useDefaultAdditionalActivities;
    }
    if (this.isAction) return false;
    return true;
  }

  get usesOnActivity() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.usesOnActivity;
    }
    return false;
  }

  get documentStub() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.documentStub;
    } else {
      return null;
    }
  }

  get clearAutoEffects() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.clearAutoEffects;
    } else {
      return false;
    }
  }

  get addAutoAdditionalActivities() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.addAutoAdditionalActivities;
    } else {
      return true;
    }
  }

  get addToDefaultAdditionalActivities() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.addToDefaultAdditionalActivities;
    } else {
      return false;
    }
  }

  get itemMacro() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.itemMacro;
    } else {
      return null;
    }
  }

  get setMidiOnUseMacroFlag() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.setMidiOnUseMacroFlag;
    } else {
      return null;
    }
  }

  get stopDefaultActivity() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.stopDefaultActivity;
    } else {
      return false;
    }
  }

  get ddbMacroDescriptionData() {
    if (this.loadedEnricher) {
      return this.loadedEnricher.ddbMacroDescriptionData;
    } else {
      return null;
    }
  }

  get ddbMacroDescription() {
    const data = this.ddbMacroDescriptionData;
    if (!data) return "";

    //   name: "fontOfMagic",
    //   label: "Font of Magic Macro", // optional
    //   type: "spell",
    //   parameters: "", // optional
    // };

    const parameters = data.parameters
      ? ` functionParams="${data.parameters}`
      : "";
    const label = data.label
      ? `{${data.label}}`
      : "";

    return `<hr><div class="ddb-macros-container"><p>[[/ddbifunc functionName="${data.name}" functionType="${data.type}"${parameters}]]${label}</div></p></div>`;
  }

  constructor({
    activityGenerator = null, effectType = "basic", enricherType = "general", notifier = null, fallbackEnricher = null,
    ddbActionType = null,
  } = {}) {
    this.ddbParser = null;
    this.document = null;
    this.name = null;
    this.isCustomAction = null;
    this.activityGenerator = activityGenerator;
    this.is2014 = null;
    this.is2024 = null;
    this.useLookupName = false;
    this.effectType = effectType;
    this.enricherType = enricherType;
    this.fallbackEnricher = fallbackEnricher;
    this.manager = null;
    this.loadedEnricher = null;
    this._originalActivity = null;
    this.notifier = notifier;
    this.hintName = null;
    this.defaultActionFeatures = {};
    this.customActionFeatures = {};
    this.ddbActionType = ddbActionType;
    this.activityNameMatchFeature = null;
  }

  async load({ ddbParser, document, name = null, is2014 = null, fallbackEnricher = null } = {}) {
    if (fallbackEnricher) this.fallbackEnricher = fallbackEnricher;
    this.ddbParser = ddbParser;
    this.document = ddbParser?.data ?? document;
    this.name = ddbParser?.originalName ?? name ?? document.flags?.ddbimporter?.originalName ?? document.name;
    this.isCustomAction = this.document.flags?.ddbimporter?.isCustomAction;
    this.is2014 = is2014 ?? this.ddbParser?.is2014 ?? this.document.flags?.ddbimporter?.is2014 ?? false;
    this.is2024 = !this.is2014;
    this.useLookupName = false;
    await this._prepare();
  }

  async init() {
    this.manager = new DDBSummonsManager({ notifier: this.notifier });
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

  get isAction() {
    return this.ddbParser.isAction ?? false;
  }

  // eslint-disable-next-line complexity
  _applyActivityDataOverride(activity, overrideData) {
    if (overrideData.name) activity.name = overrideData.name;
    if (overrideData.id) activity._id = overrideData.id;

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

    if (overrideData.removeSpellSlotConsume || overrideData.noSpellslot) {
      foundry.utils.setProperty(activity, "consumption.spellSlot", false);
    }

    if (overrideData.targetSelf) {
      foundry.utils.setProperty(activity, "target.affects.type", "self");
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
      activity.target.prompt = false;
    }

    if (overrideData.overrideTemplate || overrideData.overrideTarget)
      foundry.utils.setProperty(activity, "target.override", true);

    if (overrideData.overrideRange)
      foundry.utils.setProperty(activity, "range.override", true);

    if (overrideData.activationType) {
      activity.activation = {
        type: overrideData.activationType,
        value: overrideData.activationValue ?? activity.activation?.value ?? 1,
        condition: overrideData.activationCondition ?? activity.activation?.condition ?? "",
      };
    } else if (overrideData.activationValue) {
      foundry.utils.setProperty(activity, "activation.value", overrideData.activationValue);
    }
    if (overrideData.activationCondition) {
      foundry.utils.setProperty(activity, "activation.condition", overrideData.activationCondition);
    }

    if (overrideData.overrideActivation)
      foundry.utils.setProperty(activity, "activation.override", true);

    if (overrideData.midiManualReaction && AutoEffects.effectModules().midiQolInstalled)
      MidiEffects.forceManualReaction(this.data);

    if (overrideData.midiDamageReaction && AutoEffects.effectModules().midiQolInstalled)
      MidiEffects.reactionOnDamage(this.data);

    if (foundry.utils.hasProperty(overrideData, "flatAttack")) {
      foundry.utils.setProperty(activity, "attack.bonus", overrideData.flatAttack);
      foundry.utils.setProperty(activity, "attack.flat", true);
    }

    if (overrideData.removeDamageParts) {
      activity.damage.parts = [];
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

    if (overrideData.func) overrideData.func(activity);

    return activity;
  }

  applyActivityOverride(activityData) {
    this.originalActivity = activityData;
    const activity = this.activity;
    if (!activity) return activityData;

    return this._applyActivityDataOverride(activityData, activity);
  }

  createDefaultEffects() {
    this.data = AutoEffects.forceDocumentEffect(this.data);
    if (game.modules.get("vision-5e")?.active ?? false)
      this.data = AutoEffects.addVision5eStub(this.data);
  }

  get _canApplyMidiEffects() {
    const addAutomationEffects = this.loadedEnricher?.useMidiAutomations ?? false;
    return addAutomationEffects;
  }

  // eslint-disable-next-line complexity
  async createEffects() {
    const effectHints = this.effects;
    const effects = [];

    const applyMidiOnlyEffects = this._canApplyMidiEffects;

    // always set item macros and on use macro flags
    const itemMacro = this.itemMacro;
    if (itemMacro && applyMidiOnlyEffects) {
      const type = itemMacro.type ?? itemMacro.macroType;
      const name = itemMacro.name ?? itemMacro.macroName;
      await DDBMacros.setItemMacroFlag(this.data, type, name);
    }

    const setMidiOnUseMacroFlag = this.setMidiOnUseMacroFlag;
    if (setMidiOnUseMacroFlag && applyMidiOnlyEffects) {
      DDBMacros.setMidiOnUseMacroFlagV2({
        document: this.data,
        macroType: setMidiOnUseMacroFlag.macroType ?? setMidiOnUseMacroFlag.type,
        macroName: setMidiOnUseMacroFlag.macroName ?? setMidiOnUseMacroFlag.name,
        triggerPoints: setMidiOnUseMacroFlag.triggerPoints,
        functionCall: setMidiOnUseMacroFlag.functionCall,
      });
    }

    if (!effectHints || effectHints?.length === 0) return effects;

    for (const effectHintFunction of effectHints) {
      const effectHint = utils.isFunction(effectHintFunction)
        ? effectHintFunction()
        : effectHintFunction;
      if (!effectHint) continue;
      if (effectHint.daeNever && AutoEffects.effectModules().daeInstalled) continue;
      if (effectHint.daeOnly && !AutoEffects.effectModules().daeInstalled) continue;
      if (effectHint.midiNever && AutoEffects.effectModules().midiQolInstalled) continue;
      if (effectHint.midiOnly && !applyMidiOnlyEffects) continue;
      if (effectHint.activeAurasNever && AutoEffects.effectModules().activeAurasInstalled) continue;
      if (effectHint.activeAurasOnly && !AutoEffects.effectModules().activeAurasInstalled) continue;
      if (effectHint.atlNever && AutoEffects.effectModules().atlInstalled) continue;
      if (effectHint.atlOnly && !AutoEffects.effectModules().atlInstalled) continue;
      let name = effectHint.name ?? this.name;
      let effectOptions = effectHint.options ?? {};

      let effect;
      if (effectHint.noCreate && this.data.effects.length > 0) {
        effect = this.data.effects[0];
        if (effectHint.name) effect.name = effectHint.name;
        if (effectOptions.description) effect.description = effectOptions.description;
      } else if (effectHint.noCreate && effects.length > 0) {
        effect = effects[effects.length - 1];
      } else {
        switch (effectHint.type ?? this.effectType) {
          case "enchant":
            effect = EnchantmentEffects.EnchantmentEffect(this.data, name, effectOptions);
            if (effectHint.magicalBonus) {
              EnchantmentEffects.addMagicalBonus({
                effect,
                nameAddition: effectHint.magicalBonus.name,
                bonus: effectHint.magicalBonus.bonus,
                bonusMode: effectHint.magicalBonus.mode,
                makeMagical: effectHint.magicalBonus.makeMagical,
              });
            }
            break;
          case "feat":
            effect = AutoEffects.FeatEffect(this.data, name, effectOptions);
            break;
          case "spell":
            effect = AutoEffects.SpellEffect(this.data, name, effectOptions);
            break;
          case "monster":
            effect = AutoEffects.MonsterFeatureEffect(this.data, name, effectOptions);
            break;
          case "item":
            effect = AutoEffects.ItemEffect(this.data, name, effectOptions);
            break;
          case "basic":
          default:
            effect = AutoEffects.BaseEffect(this.data, name, effectOptions);
        }

        if (!effectOptions.durationSeconds && !effectOptions.durationRounds) {
          const duration = DDBDescriptions.getDuration(this.data.system.description.value, false);
          if (duration.type) {
            foundry.utils.setProperty(effect, "duration.seconds", duration.second);
            foundry.utils.setProperty(effect, "duration.rounds", duration.round);
          }
          const specialDurations = utils.addArrayToProperties(effect.flags.dae.specialDuration, duration.dae ?? []);
          foundry.utils.setProperty(effect, "flags.dae.specialDuration", specialDurations);
        }

      }

      if (effectHint.statuses) {
        for (const status of effectHint.statuses) {
          const splitStatus = status.split(":");
          ChangeHelper.addStatusEffectChange({
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

      if (effectHint.atlChanges && AutoEffects.effectModules().atlInstalled) {
        effect.changes.push(...effectHint.atlChanges);
      }

      if (effectHint.tokenMagicChanges && AutoEffects.effectModules().tokenMagicInstalled) {
        effect.changes.push(...effectHint.tokenMagicChanges);
      }

      if (effectHint.midiChanges && applyMidiOnlyEffects) {
        effect.changes.push(...effectHint.midiChanges);
      }

      if (effectHint.daeChanges && AutoEffects.effectModules().daeInstalled) {
        effect.changes.push(...effectHint.daeChanges);
      }

      if (effectHint.daeStackable && AutoEffects.effectModules().daeInstalled) {
        foundry.utils.setProperty(effect, "flags.dae.stackable", effectHint.daeStackable);
      }

      if (effectHint.daeSpecialDurations && AutoEffects.effectModules().daeInstalled) {
        foundry.utils.setProperty(effect, "flags.dae.specialDuration", effectHint.daeSpecialDurations);
      }

      if (effectHint.midiProperties && applyMidiOnlyEffects) {
        foundry.utils.setProperty(this.data, "flags.midiProperties", effectHint.midiProperties);
      }

      if (effectHint.activityMatch) {
        foundry.utils.setProperty(effect, "flags.ddbimporter.activityMatch", effectHint.activityMatch);
      }

      if (effectHint.ignoreTransfer) {
        foundry.utils.setProperty(effect, "flags.ddbimporter.ignoreTransfer", effectHint.ignoreTransfer);
      }

      if (effectHint.activitiesMatch) {
        foundry.utils.setProperty(effect, "flags.ddbimporter.activitiesMatch", effectHint.activitiesMatch);
      }

      if (effectHint.macroChanges && applyMidiOnlyEffects) {
        for (const macroChange of effectHint.macroChanges) {
          effect.changes.push(DDBMacros.generateMacroChange(macroChange));
        }
      }

      if (effectHint.onUseMacroChanges && applyMidiOnlyEffects) {
        for (const macroChange of effectHint.onUseMacroChanges) {
          effect.changes.push(DDBMacros.generateOnUseMacroChange(macroChange));
        }
      }

      if (effectHint.targetUpdateMacroChanges && applyMidiOnlyEffects) {
        for (const macroChange of effectHint.targetUpdateMacroChanges) {
          effect.changes.push(DDBMacros.generateTargetUpdateMacroChange(macroChange));
        }
      }

      if (effectHint.damageBonusMacroChanges && applyMidiOnlyEffects) {
        for (const macroChange of effectHint.damageBonusMacroChanges) {
          effect.changes.push(DDBMacros.generateDamageBonusMacroChange(macroChange));
        }
      }

      if (effectHint.optionalMacroChanges && applyMidiOnlyEffects) {
        for (const macroChange of effectHint.optionalMacroChanges) {
          effect.changes.push(DDBMacros.generateOptionalMacroChange(macroChange));
        }
      }

      if (effectHint.midiOptionalChanges && applyMidiOnlyEffects) {
        for (const midiChange of effectHint.midiOptionalChanges) {
          for (const [key, value] of Object.entries(midiChange.data)) {
            effect.changes.push(
              ChangeHelper.customChange(value, midiChange.priority ?? 5, `flags.midi-qol.optional.${midiChange.name}.${key}`),
            );
          }
        }
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

      if (!effectHint.noCreate) effects.push(effect);
    }

    AutoEffects.forceDocumentEffect(this.data);

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

    if (override.ddbMacroDescription) {
      const description = this.ddbMacroDescription;
      this.data.system.description.value += description;
      if (this.data.system.description.chat !== "") this.data.system.description.chat += description;
    }

    if (override?.func) {
      override.func({
        enricher: this,
      });
    }

    return this.data;
  }

  _getActivityDataFromDDBParent(activityHint, i, ddbParent) {
    const activationData = foundry.utils.mergeObject({
      nameIdPrefix: "add",
      nameIdPostfix: `${i}`,
    }, activityHint.constructor);
    activationData.ddbParent = ddbParent;
    const activity = new this.activityGenerator(activationData);
    activity.build(activityHint.build);

    if (activityHint.id) activity.data._id = activityHint.id;

    return {
      activities: {
        [activity.data._id]: activity.data,
      },
      effects: [],
    };
  }

  async _getActivityDataFromAction({ name, type, isAttack = null, rename = null, id = null }, y) {
    const result = {
      activities: {},
      effects: [],
    };
    if (!this.ddbParser?.ddbCharacter) return result;
    const actions = this.ddbParser.ddbCharacter._characterFeatureFactory.getActions({ name, type });
    if (actions.length === 0) return result;
    const actionFeatures = await Promise.all(actions.map(async (action) => {
      const feature = await this.ddbParser.ddbCharacter._characterFeatureFactory.getFeatureFromAction({
        action,
        isAttack,
        manager: this.manager,
      });
      return feature;
    }));

    actionFeatures.forEach((feature, i) => {
      for (const activityKey of (Object.keys(feature.system.activities))) {
        let newKey = id ?? `${activityKey.slice(0, -3)}Ne${y + i}`;
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
    this.customActionFeatures[name] = actionFeatures;
    logger.debug(`Additional Activities from Action ${name}`, { result });
    return result;

  }

  async _addActivityHintAdditionalActivities(ddbParent) {
    const additionalActivityHints = this.additionalActivities;

    if (!additionalActivityHints) return;
    if (!this.activityGenerator) return;

    let i = this.data.system.activities.length ?? 0 + 1;
    for (const activityHint of additionalActivityHints) {
      const actionActivity = foundry.utils.getProperty(activityHint, "action");
      const duplicate = foundry.utils.getProperty(activityHint, "duplicate");
      const _id = foundry.utils.getProperty(activityHint, "id");
      const activityData = {
        activities: {},
        effects: [],
      };

      if (duplicate) {
        const key = Object.keys(this.data.system.activities)[0];
        const activityClone = foundry.utils.deepClone(this.data.system.activities[key]);
        activityClone._id = _id ?? `${activityClone._id.slice(0, -3)}clo`;
        activityData.activities = [activityClone];
      } else if (actionActivity) {
        logger.debug(`Building activity from action ${actionActivity.name}`, { actionActivity, i });
        const result = await this._getActivityDataFromAction(actionActivity, i);
        activityData.activities = result.activities;
        activityData.effects = result.effects;
      } else {
        const result = this._getActivityDataFromDDBParent(activityHint, i, ddbParent);
        activityData.activities = result.activities;
        activityData.effects = result.effects;
      }

      for (let activity of Object.values(activityData.activities)) {
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

  _addDefaultActionMatchedActivities() {
    foundry.utils.setProperty(this.data, "flags.ddbimporter.defaultAdditionalActivities", {
      enabled: true,
      data: {},
    });
    let i = 0;
    for (const [name, features] of Object.entries(this.defaultActionFeatures)) {
      let y = 0;
      for (const feature of features) {
        const activityData = {
          activities: {},
          effects: [],
          nameData: {},
        };

        const activityKeys = Object.keys(feature.system.activities);
        const activityCount = activityKeys.length;
        const featureName = foundry.utils.getProperty(feature, "flags.ddbimporter.originalName") ?? feature.name;

        logger.debug(`Processing out ${activityCount} default additional activities for ${name}`, {
          feature,
          i,
          y,
          name,
          activityKeys,
          featureName,
        });

        for (const activityKey of activityKeys) {
          let newKey = `${activityKey.slice(0, -3)}Ne${y + i}`;
          while (activityData.activities[newKey] || this.data.system.activities[newKey]) {
            newKey = `${activityKey.slice(0, -3)}Ne${y + i + 1}`;
          }
          activityData.activities[newKey] = foundry.utils.deepClone(feature.system.activities[activityKey]);
          activityData.activities[newKey]._id = `${newKey}`;

          const activityName = activityData.activities[newKey].name;
          if (!activityName || activityName === "") {
            // eslint-disable-next-line max-depth
            if (activityCount === 1) {
              activityData.activities[newKey].name = featureName;
            } else {
              activityData.activities[newKey].name = `${featureName} (${utils.capitalize(activityData.activities[newKey].type)})`;
            }
          }
          activityData.nameData[newKey] = Array.from(new Set([featureName, activityData.activities[newKey].name]));
        }
        activityData.effects.push(...(foundry.utils.deepClone(feature.effects)));

        // console.warn(`Final activity map`,{
        //   activityData
        // })

        for (const activity of Object.values(activityData.activities)) {
          this.data.system.activities[activity._id] = activity;
          i++;
        }
        if (activityData.effects) {
          this.data.effects.push(...activityData.effects);
        }
        this.data.effects = this.data.effects.filter((v, i, a) => {
          if (v.name.startsWith("Status:")) {
            return a.findIndex((t) =>
              t.name.startsWith("Status:")
              && t.name === v.name
              && !t.flags?.ddbimporter?.activitiesMatch
              && !t.flags?.ddbimporter?.activityMatch) === i;
          }
          return true;
        });
        y++;

        foundry.utils.setProperty(this.data, "flags.ddbimporter.defaultAdditionalActivities.data", {
          featureName,
          activityCount,
          activityKeys: Object.keys(activityData.activities),
          nameMap: activityData.nameData,
        });

      }
    }
  }

  async addAdditionalActivities(ddbParent) {
    const useDefaultActivities = this.useDefaultAdditionalActivities;
    const addToDefaultAdditionalActivities = this.addToDefaultAdditionalActivities;

    if (useDefaultActivities) {
      logger.debug(`Adding default additional activities for ${this.ddbParser.originalName}`);
      this._addDefaultActionMatchedActivities();
      logger.debug(`Complete adding default additional activities for ${this.ddbParser.originalName}`, {
        this: this,
        data: foundry.utils.deepClone(this.data),
      });
    }

    if (!useDefaultActivities || addToDefaultAdditionalActivities) {
      logger.debug(`Adding custom additional activities for ${this.ddbParser.originalName}`);
      await this._addActivityHintAdditionalActivities(ddbParent);
    }
  }

  getFeatureActionsName({ type = null } = {}) {
    const results = {
      all: [],
      name: [],
      id: [],
      options: [],
      choices: [],
    };

    if (!this.ddbParser?.ddbDefinition) return results;

    const name = this.ddbParser.ddbDefinition.name;
    const id = this.ddbParser.ddbDefinition.id;
    const entityTypeId = this.ddbParser.ddbDefinition.entityTypeId;
    const derivedType = type ?? this.ddbActionType ?? this.enricherType;

    if (!this.ddbParser?.ddbData?.character?.actions?.[derivedType]) return results;

    const nameMatches = this.ddbParser.ddbData.character.actions[derivedType].filter((action) =>
      action.name === name
      && action.componentId === id
      && action.componentTypeId === entityTypeId,
    );

    results.name = nameMatches;

    const idMatches = this.ddbParser.ddbData.character.actions[derivedType].filter((action) =>
      !nameMatches.some((m) => m.id === action.id)
      && action.componentId === id
      && action.componentTypeId === entityTypeId,
    );
    results.id = idMatches;

    const optionMatches = this.ddbParser.ddbData.character.actions[derivedType].filter((action) => {
      const actionComponentId = foundry.utils.getProperty(action, "flags.ddbimporter.componentId");
      const actionComponentTypeId = foundry.utils.getProperty(action, "flags.ddbimporter.componentTypeId");

      const optionMatch = this.ddbParser.ddbData.character.options[derivedType].find((option) =>
        option.definition.id === actionComponentId
        && option.definition.entityTypeId === actionComponentTypeId,
      );

      return optionMatch
        && !nameMatches.some((m) => m.id === action.id)
        && !idMatches.some((m) => m.id === action.id)
        && optionMatch.componentId === id
        && optionMatch.componentTypeId === entityTypeId;
    });

    results.options = optionMatches;

    if (this.ddbParser.ddbFeature) {
      const choices = DDBDataUtils.getChoices({
        ddb: this.ddbParser.ddbData,
        type: derivedType,
        feat: this.ddbParser.ddbFeature,
        selectionOnly: true,
      });

      // console.warn(`CHOICES`, {
      //   choices,
      //   this: this,
      // });

      const choiceMatches = this.ddbParser.ddbData.character.actions[derivedType].filter((action) => {
        const choiceMatch = choices.some((choice) => choice.id === action.componentId);

        return choiceMatch
          && !nameMatches.some((m) => m.id === action.id)
          && !idMatches.some((m) => m.id === action.id)
          && !optionMatches.some((m) => m.id === action.id);
      });

      results.choices = choiceMatches;
    }

    results.all = [...nameMatches, ...idMatches, ...optionMatches, ...results.choices];

    // console.warn(`Action match results ${name} (${derivedType})`, results);

    return results;

  }

  async _buildFeaturesFromAction({ name, type, isAttack = null } = {}) {
    if (!this.ddbParser?.ddbCharacter) return [];
    const actions = this.ddbParser.ddbCharacter._characterFeatureFactory.getActions({ name, type });
    logger.debug(`Built Actions from Action "${name}" for ${this.ddbParser.originalName}`, { actions });
    if (actions.length === 0) return [];
    const actionFeatures = await Promise.all(actions.map(async (action) => {
      const generatedActionFeature = await this.ddbParser.ddbCharacter._characterFeatureFactory.getFeatureFromAction({
        action,
        isAttack,
        manager: this.manager,
      });

      const actionFeatureName = foundry.utils.getProperty(generatedActionFeature, "flags.ddbimporter.originalName") ?? generatedActionFeature.name;
      if (this.ddbParser.originalName === actionFeatureName) {
        if (this.activityNameMatchFeature) {
          logger.warn(`Activity Name Match for ${this.ddbParser.originalName} already set`, {
            this: this,
            generatedActionFeature,
            previous: foundry.utils.deepClone(this.activityNameMatchFeature),
          });
        }
        this.activityNameMatchFeature = generatedActionFeature;
      }

      return generatedActionFeature;
    }));

    logger.debug(`Additional Features from Action ${name}`, { actionFeatures });
    return actionFeatures;

  }


  async _buildDefaultActionFeatures({ type = null } = {}) {
    const derivedType = type ?? this.ddbActionType ?? this.enricherType;
    if (!derivedType) return;
    const actions = this.getFeatureActionsName({ type: derivedType });

    const actionsToBuild = actions.all.map((action) => {
      return {
        action: {
          name: action.name,
          type: derivedType,
        },
      };
    });

    // console.warn(`Building Features from Actions for ${this.ddbParser.originalName}`, {
    //   type,
    //   derivedType,
    //   actionsToBuild,
    //   actions,
    // });

    let i = 1;
    for (const activityHint of actionsToBuild) {
      const actionActivity = foundry.utils.getProperty(activityHint, "action");

      logger.debug(`Building activity from action ${actionActivity.name}`, { actionActivity, i });
      const actionFeatures = await this._buildFeaturesFromAction(actionActivity);
      this.defaultActionFeatures[actionActivity.name] = actionFeatures;

      // console.warn(`Features from actions ${this.ddbParser.originalName}`, {
      //   actionFeatures,
      //   activityHint,
      //   this: this,
      //   activityMatchedFeatures: this.defaultActionFeatures,
      //   i,
      // });
      i++;
    }

    logger.debug(`Default Feature Action Build Complete for ${this.ddbParser.originalName}`);
  }

  customFunction(options = {}) {
    return this.loadedEnricher?.customFunction(options);
  }

}
