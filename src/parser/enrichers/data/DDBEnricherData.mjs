import { DICTIONARY } from "../../../config/_module.mjs";
import { logger } from "../../../lib/_module.mjs";
import { DDBDataUtils } from "../../lib/_module.mjs";
import CharacterSpellFactory from "../../spells/CharacterSpellFactory.js";
import DDBSpell from "../../spells/DDBSpell.js";
import { AutoEffects, ChangeHelper } from "../effects/_module.mjs";

// ---------------------------------------------------------------------------
// Type definitions for DDBEnricherData
// ---------------------------------------------------------------------------

// -- Damage Parts -----------------------------------------------------------

/**
 * @typedef {object} DDBDamagePartCustom
 * @property {boolean} enabled
 * @property {string|null} formula
 */

/**
 * @typedef {object} DDBDamagePartScaling
 * @property {("whole"|"half"|"")} mode
 * @property {number} number
 * @property {string} formula
 */

/**
 * @typedef {object} DDBDamagePart
 * @property {number|null} number
 * @property {number|null} denomination
 * @property {string} bonus
 * @property {string[]} types
 * @property {DDBDamagePartCustom} custom
 * @property {DDBDamagePartScaling} scaling
 */

// -- Consumption Targets ----------------------------------------------------

/**
 * @typedef {object} DDBConsumptionTargetScaling
 * @property {boolean} [allowed]
 * @property {(""|"amount"|"level")} [mode]
 * @property {string} [max]
 * @property {string} [formula]
 */

/**
 * @typedef {object} DDBConsumptionTarget
 * @property {("itemUses"|"activityUses"|"spellSlots"|"attribute"|string)} type
 * @property {string} target
 * @property {string|number} value
 * @property {DDBConsumptionTargetScaling} [scaling]
 */

// -- Summon Profile Keys ----------------------------------------------------

/**
 * @typedef {object} DDBSummonProfileKeyLevel
 * @property {number|null} min
 * @property {number|null} max
 */

/**
 * @typedef {object} DDBSummonProfileKey
 * @property {string} name
 * @property {number|string} count
 * @property {DDBSummonProfileKeyLevel} [level]
 */

// -- Summons Configuration --------------------------------------------------

/**
 * @typedef {object} DDBSummonsMatch
 * @property {boolean} [proficiency]
 * @property {boolean} [attacks]
 * @property {boolean} [saves]
 */

/**
 * @typedef {object} DDBSummonsBonuses
 * @property {string} [ac]
 * @property {string} [hp]
 * @property {string} [attackDamage]
 * @property {string} [saveDamage]
 * @property {string} [healing]
 */

/**
 * @typedef {object} DDBSummonsData
 * @property {DDBSummonsMatch} [match]
 * @property {DDBSummonsBonuses} [bonuses]
 * @property {*} [key] - Additional properties
 */

// -- Activity Parent Lookup -------------------------------------------------

/**
 * @typedef {object} DDBActivityParentLookup
 * @property {string} lookupName
 * @property {string} [name]
 * @property {string} [id]
 * @property {string} [type]
 * @property {DDBActivityParentLookup[]} [parent]
 * @property {boolean} [noConsumeTargets]
 * @property {boolean} [addItemConsume]
 * @property {string} [itemConsumeTargetName]
 * @property {string|number} [itemConsumeValue]
 * @property {(""|"amount"|"level")} [addScalingMode]
 * @property {string} [addScalingFormula]
 * @property {boolean} [addActivityConsume]
 * @property {string|number} [activityConsumeValue]
 * @property {(""|"amount"|"level")} [addActivityScalingMode]
 * @property {string} [addActivityScalingFormula]
 * @property {boolean} [addSpellSlotConsume]
 * @property {boolean} [removeSpellSlotConsume]
 * @property {boolean} [noSpellslot]
 * @property {string} [spellSlotConsumeTarget]
 * @property {string|number} [spellSlotConsumeValue]
 * @property {(""|"amount"|"level")} [addSpellSlotScalingMode]
 * @property {string} [addSpellSlotScalingFormula]
 * @property {DDBConsumptionTarget[]} [additionalConsumptionTargets]
 * @property {string|number} [addConsumptionScalingMax]
 * @property {string} [targetType]
 * @property {string|number} [targetCount]
 * @property {boolean} [targetChoice]
 * @property {boolean} [targetSelf]
 * @property {boolean} [rangeSelf]
 * @property {string} [rangeType]
 * @property {number|null} [rangeValue]
 * @property {string} [rangeSpecial]
 * @property {boolean} [noTemplate]
 * @property {boolean} [overrideTemplate]
 * @property {boolean} [overrideTarget]
 * @property {boolean} [overrideRange]
 * @property {string} [activationType]
 * @property {number} [activationValue]
 * @property {string} [activationCondition]
 * @property {boolean} [overrideActivation]
 * @property {boolean} [midiManualReaction]
 * @property {boolean} [midiDamageReaction]
 * @property {boolean} [midiHealingReaction]
 * @property {boolean} [midiSaveReaction]
 * @property {string} [midiUseCondition]
 * @property {string} [flatAttack]
 * @property {boolean} [removeDamageParts]
 * @property {DDBDamagePart[]} [damageParts]
 * @property {boolean} [allowCritical]
 * @property {boolean} [allowMagical]
 * @property {boolean} [noeffect]
 * @property {Record<string, any>|(() => Record<string, any>)} [data]
 * @property {(params: {activity: any}) => void|Promise<void>} [func]
 * @property {DDBSummonProfileKey[]} [profileKeys]
 * @property {DDBSummonsData} [summons]
 * @property {boolean} [addSingleFreeUse]
 * @property {string} [addSingleFreeRecoveryPeriod]
 * @property {boolean} [additionalDamageIncludeBase]
 * @property {boolean} [stopHealSpellActivity]
 * @property {boolean} [splitDamage]
 * @property {string} [addSpellUuid]
 */

// -- Activity Data (main getter) --------------------------------------------

/**
 * @typedef {object} DDBActivityData
 * @property {string} [name]
 * @property {string} [id]
 * @property {string} [type]
 * @property {DDBActivityParentLookup[]} [parent]
 * @property {boolean} [noConsumeTargets]
 * @property {boolean} [addItemConsume]
 * @property {string} [itemConsumeTargetName]
 * @property {string|number} [itemConsumeValue]
 * @property {(""|"amount"|"level")} [addScalingMode]
 * @property {string} [addScalingFormula]
 * @property {boolean} [addActivityConsume]
 * @property {string|number} [activityConsumeValue]
 * @property {(""|"amount"|"level")} [addActivityScalingMode]
 * @property {string} [addActivityScalingFormula]
 * @property {boolean} [addSpellSlotConsume]
 * @property {boolean} [removeSpellSlotConsume]
 * @property {boolean} [noSpellslot]
 * @property {string} [spellSlotConsumeTarget]
 * @property {string|number} [spellSlotConsumeValue]
 * @property {(""|"amount"|"level")} [addSpellSlotScalingMode]
 * @property {string} [addSpellSlotScalingFormula]
 * @property {DDBConsumptionTarget[]} [additionalConsumptionTargets]
 * @property {string|number} [addConsumptionScalingMax]
 * @property {string} [targetType]
 * @property {string|number} [targetCount]
 * @property {boolean} [targetChoice]
 * @property {boolean} [targetSelf]
 * @property {boolean} [rangeSelf]
 * @property {string} [rangeType]
 * @property {number|null} [rangeValue]
 * @property {string} [rangeSpecial]
 * @property {boolean} [noTemplate]
 * @property {boolean} [overrideTemplate]
 * @property {boolean} [overrideTarget]
 * @property {boolean} [overrideRange]
 * @property {string} [activationType]
 * @property {number} [activationValue]
 * @property {string} [activationCondition]
 * @property {boolean} [overrideActivation]
 * @property {boolean} [midiManualReaction]
 * @property {boolean} [midiDamageReaction]
 * @property {boolean} [midiHealingReaction]
 * @property {boolean} [midiSaveReaction]
 * @property {string} [midiUseCondition]
 * @property {string} [flatAttack]
 * @property {boolean} [removeDamageParts]
 * @property {DDBDamagePart[]} [damageParts]
 * @property {boolean} [allowCritical]
 * @property {boolean} [allowMagical]
 * @property {boolean} [noeffect]
 * @property {Record<string, any>|(() => Record<string, any>)} [data]
 * @property {(params: {activity: any}) => void|Promise<void>} [func]
 * @property {DDBSummonProfileKey[]} [profileKeys]
 * @property {DDBSummonsData} [summons]
 * @property {boolean} [addSingleFreeUse]
 * @property {string} [addSingleFreeRecoveryPeriod]
 * @property {boolean} [additionalDamageIncludeBase]
 * @property {boolean} [stopHealSpellActivity]
 * @property {boolean} [splitDamage]
 * @property {string} [addSpellUuid]
 */

// -- Magical Bonus ----------------------------------------------------------

/**
 * @typedef {object} DDBMagicalBonus
 * @property {string|null} [nameAddition]
 * @property {string|number|null} [bonus]
 * @property {string} [mode]
 * @property {boolean} [makeMagical]
 */

// -- Macro Change Inputs ----------------------------------------------------

/**
 * @typedef {object} DDBMacroChange
 * @property {string} [macroValues]
 * @property {string} [macroType]
 * @property {string} [macroName]
 * @property {string} [keyPostfix]
 * @property {number} [priority]
 * @property {boolean|null} [ddbFunctions]
 * @property {string|null} [functionCall]
 * @property {string} [functionParams]
 */

/**
 * @typedef {object} DDBOnUseMacroChange
 * @property {string} macroPass
 * @property {string} [macroType]
 * @property {string} [macroName]
 * @property {*} [document]
 * @property {number} [priority]
 * @property {string} [macroParams]
 * @property {string|null} [functionCall]
 * @property {string} [functionParams]
 */

/**
 * @typedef {object} DDBDamageBonusMacroChange
 * @property {string} [macroType]
 * @property {string} [macroName]
 * @property {*} [document]
 * @property {number} [priority]
 * @property {string|null} [functionCall]
 */

/**
 * @typedef {object} DDBTargetUpdateMacroChange
 * @property {string} [macroPass]
 * @property {string} [macroType]
 * @property {string} [macroName]
 * @property {*} document
 * @property {number} [priority]
 * @property {string} [macroParams]
 * @property {string|null} [functionCall]
 * @property {string} [functionParams]
 */

/**
 * @typedef {object} DDBMidiOptionalChange
 * @property {string} name
 * @property {number} [priority]
 * @property {Record<string, string|number>} data
 */

/**
 * @typedef {object} DDBOptionalMacroChange
 * @property {string} optionPostfix
 * @property {string|null} [macroPass]
 * @property {string} [macroType]
 * @property {string} [macroName]
 * @property {*} [document]
 * @property {number} [priority]
 * @property {string} [macroParams]
 * @property {string|null} [functionCall]
 * @property {string} [functionParams]
 */

// -- Effect Options ---------------------------------------------------------

/**
 * @typedef {object} DDBEffectOptions
 * @property {string} [description]
 * @property {number} [durationSeconds]
 * @property {number} [durationRounds]
 * @property {boolean} [transfer]
 * @property {boolean} [disabled]
 * @property {*} [key] - Additional properties
 */

// -- Aura Effects -----------------------------------------------------------

/**
 * @typedef {object} DDBAuraEffects
 * @property {*} [key] - Additional properties
 */

// -- Effect Hint ------------------------------------------------------------

/**
 * @typedef {object} DDBEffectHint
 * @property {boolean} [noCreate]
 * @property {Record<string, any>} [raw]
 * @property {string} [type]
 * @property {string} [name]
 * @property {Record<string, any>} [data]
 * @property {DDBEffectOptions} [options]
 * @property {any[]|((data: any) => any[])} [changes]
 * @property {boolean} [changesOverwrite]
 * @property {any[]} [atlChanges]
 * @property {any[]} [tokenMagicChanges]
 * @property {any[]} [midiChanges]
 * @property {any[]} [daeChanges]
 * @property {string} [daeStackable]
 * @property {string[]} [daeSpecialDurations]
 * @property {string[]} [statuses]
 * @property {string[]} [riderStatuses]
 * @property {string} [activityMatch]
 * @property {string[]} [activitiesMatch]
 * @property {boolean} [ignoreTransfer]
 * @property {Record<string, any>} [midiProperties]
 * @property {DDBMidiOptionalChange[]} [midiOptionalChanges]
 * @property {DDBOptionalMacroChange[]} [optionalMacroChanges]
 * @property {DDBOnUseMacroChange[]} [onUseMacroChanges]
 * @property {DDBMacroChange[]} [macroChanges]
 * @property {DDBTargetUpdateMacroChange[]} [targetUpdateMacroChanges]
 * @property {DDBDamageBonusMacroChange[]} [damageBonusMacroChanges]
 * @property {DDBAuraEffects} [auraeffects]
 * @property {DDBMagicalBonus} [magicalBonus]
 * @property {boolean|string} [descriptionHint]
 * @property {boolean} [daeOnly]
 * @property {boolean} [daeNever]
 * @property {boolean} [atlOnly]
 * @property {boolean} [atlNever]
 * @property {boolean} [midiOnly]
 * @property {boolean} [midiNever]
 * @property {boolean} [activeAurasOnly]
 * @property {boolean} [activeAurasNever]
 * @property {boolean} [auraeffectsOnly]
 * @property {boolean} [auraeffectsNever]
 * @property {boolean} [aurasOnly]
 * @property {boolean} [aurasNever]
 * @property {(params: {effect: any}) => void|Promise<void>} [func]
 */

// -- Override Data ----------------------------------------------------------

/**
 * @typedef {object} DDBOverrideData
 * @property {boolean} [noTemplate]
 * @property {boolean} [removeDamage]
 * @property {boolean} [rangeSelf]
 * @property {boolean} [replaceActivityUses]
 * @property {boolean} [forceSpellAdvancement]
 * @property {string} [descriptionSuffix]
 * @property {boolean} [ddbMacroDescription]
 * @property {Record<string, any>} [data]
 * @property {(params: {enricher: any}) => void|Promise<void>} [func]
 */

// -- Additional Activities --------------------------------------------------

/**
 * @typedef {object} DDBActivityAction
 * @property {string} name
 * @property {string} type
 * @property {boolean|null} [isAttack]
 * @property {string[]|null} [rename]
 * @property {string|null} [id]
 */

/**
 * @typedef {object} DDBActivityConstructor
 * @property {string} name
 * @property {string} type
 * @property {*} [key] - Additional properties
 */

/**
 * @typedef {object} DDBActivityBuild
 * @property {boolean} [generateConsumption]
 * @property {boolean} [generateTarget]
 * @property {boolean} [generateRange]
 * @property {boolean} [generateActivation]
 * @property {boolean} [generateDamage]
 * @property {boolean} [generateSave]
 * @property {boolean} [generateDuration]
 * @property {boolean} [generateHealing]
 * @property {boolean} [generateUtility]
 * @property {boolean} [generateDDBMacro]
 * @property {boolean} [noeffect]
 * @property {boolean} [noSpellslot]
 * @property {boolean} [allowCritical]
 * @property {boolean|string} [onsave]
 * @property {string} [onSave]
 * @property {Record<string, any>} [activationOverride]
 * @property {Record<string, any>} [durationOverride]
 * @property {Record<string, any>} [rangeOverride]
 * @property {Record<string, any>} [targetOverride]
 * @property {Record<string, any>} [saveOverride]
 * @property {DDBDamagePart[]} [damageParts]
 * @property {string} [img]
 * @property {{name: string, function: string, visible?: boolean, parameters?: string}} [ddbMacroOverride]
 * @property {*} [key] - Additional properties
 */

/**
 * @typedef {object} DDBAdditionalActivity
 * @property {boolean} [duplicate]
 * @property {DDBActivityAction} [action]
 * @property {DDBActivityConstructor} [constructor]
 * @property {DDBActivityBuild} [build]
 * @property {string|null} [id]
 * @property {Partial<DDBActivityData>} [overrides]
 */

// -- Document Stub ----------------------------------------------------------

/**
 * @typedef {object} DDBDocumentStub
 * @property {boolean} [stopDefaultActivity]
 * @property {boolean} [replaceDefaultActivity]
 * @property {Record<string, any>} [data]
 * @property {string} [documentType]
 * @property {string} [parsingType]
 * @property {{value: string, baseItem?: string}} [systemType]
 * @property {{name: string, type: string, uuid?: string}} [copySRD]
 */

// -- Item Macro -------------------------------------------------------------

/**
 * @typedef {object} DDBItemMacro
 * @property {string} [type]
 * @property {string} [name]
 * @property {string} [macroType]
 * @property {string} [macroName]
 */

// -- Set MIDI On Use Macro Flag ---------------------------------------------

/**
 * @typedef {object} DDBSetMidiOnUseMacroFlag
 * @property {string} [type]
 * @property {string} [name]
 * @property {string} [macroType]
 * @property {string} [macroName]
 * @property {string[]} [triggerPoints]
 * @property {string|null} [functionCall]
 */

// -- Macro Description Data -------------------------------------------------

/**
 * @typedef {object} DDBMacroDescriptionData
 * @property {string} name
 * @property {string} type
 * @property {string} [label]
 * @property {string} [parameters]
 */

export {};


/* eslint-disable class-methods-use-this */
export default class DDBEnricherData {

  static META_DATA = {};

  static AutoEffects = AutoEffects;

  static ChangeHelper = ChangeHelper;

  getFeatureActionsName({ type = null } = {}) {
    return this.ddbEnricher.getFeatureActionsName({ type });
  }

  get parentIdentifier() {
    const parent = this.ddbEnricher.findActionParent("feat");
    const parentName = parent ? parent.definition.name : this.name;
    return DDBDataUtils.classIdentifierName(parentName);
  }

  hasClassFeature({ featureName, className = null, subClassName = null } = {}) {
    if (!this.ddbParser?.ddbData) return false;

    return DDBDataUtils.hasClassFeature({
      ddbData: this.ddbParser.ddbData,
      featureName,
      className,
      subClassName,
    });
  }

  get isAction() {
    return this.ddbParser.isAction ?? false;
  }

  isClass(name) {
    return this.ddbParser.klass === name;
  }

  isSubclass(name) {
    return this.ddbParser.subKlass === name || this.ddbParser.subClass === name;
  }

  hasSubclass(name) {
    if (!this.ddbParser?.ddbData) return false;
    return DDBDataUtils.hasSubClass({
      ddbData: this.ddbParser.ddbData,
      subClassName: name,
    });
  }

  getClassIdentifier(name) {
    return DDBDataUtils.classIdentifierName(name);
  }

  hasAction({ name, type } = {}) {
    return this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      a.name === name,
    );
  }

  _getSpentValue(type, name, matchSubClass = null, includesName = false) {
    const spent = this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || DDBDataUtils.findSubClassByFeatureId(this.ddbParser.ddbData, a.componentId) === matchSubClass),
    )?.limitedUse?.numberUsed ?? null;
    return spent;
  }

  _getMaxValue(type, name, matchSubClass = null, includesName = false) {
    const max = this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || DDBDataUtils.findSubClassByFeatureId(this.ddbParser.ddbData, a.componentId) === matchSubClass),
    )?.limitedUse?.maxUses ?? null;
    return max;
  }

  _getGeneratedUses({ type, name, matchSubClass = null, scaleLink = null, includesName = false } = {}) {
    const action = this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || DDBDataUtils.findSubClassByFeatureId(this.ddbParser.ddbData, a.componentId) === matchSubClass),
    );

    const uses = DDBDataUtils.getLimitedUses({
      data: action.limitedUse,
      description: action.description,
      scaleValue: scaleLink
        ?? (this.ddbParser.useUsesScaleValueLink && this.ddbParser.scaleValueUsesLink
          ? this.ddbParser.scaleValueUsesLink
          : null),
    });
    return uses;
  }

  _getUsesWithSpent({ type, name, max, defaultSpent = null, period = "", formula = null, override = null, matchSubClass = null, includesName = false } = {}) {
    const uses = {
      spent: this._getSpentValue(type, name, matchSubClass, includesName) ?? defaultSpent,
      max,
    };

    if (formula) {
      uses.recovery = [{ period, type: "formula", formula }];
    } else if (period != "") {
      uses.recovery = [{ period, type: 'recoverAll', formula: undefined }];
    }

    if (!max) {
      uses.max = this._getMaxValue(type, name, matchSubClass, includesName);
    }

    if (override) {
      uses.override = true;
    }

    return uses;
  }

  _getSpellsForFeature({ type, name, onlyLimitedUse = true } = {}) {
    const spells = this.ddbParser.ddbData.character.spells[type].filter((s) => {
      if (onlyLimitedUse && !s.limitedUse) return false;
      const id = type === "class"
        ? DDBDataUtils.determineActualFeatureId(this.ddbParser.ddbData, s.componentId)
        : s.componentId;
      const lookupType = type === "class" ? "classFeature" : type;
      const lookup = CharacterSpellFactory.getDDBSpellLookup(this.ddbParser.ddbData, lookupType, id);
      if (lookup.name === name) return true;
      return false;
    });
    return spells;
  }

  _getSpellUsesWithSpent({ type, name, max, defaultSpent = null, period = "", formula = null, override = null } = {}) {
    const spells = this._getSpellsForFeature({ type, name });

    if (spells.length === 0) {
      logger.error(`No spells found for feature ${name} of type ${type}`);
      return {
        spent: defaultSpent,
        max,
      };
    }

    const uses = DDBSpell.getUses(spells[0].limitedUse);

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

  _buildDamagePartsWithBase() {
    const original = this.ddbEnricher.originalActivity;

    const base = foundry.utils.deepClone(this.data.system.damage.base);
    const parts = foundry.utils.deepClone(original?.damage.parts ?? []);
    return [base, ...parts];
  }


  static allDamageTypes(exclude = []) {
    return DICTIONARY.actions.damageType
      .filter((d) => d.name !== null)
      .map((d) => d.name)
      .filter((d) => !exclude.includes(d));
  }

  /**
   * Creates a basic damage part with the given parameters.
   * @param {object} [opts] An object containing the parameters.
   * @param {number} [opts.number] The number of dice to roll.
   * @param {number} [opts.denomination] The denomination of the dice.
   * @param {string} [opts.type] The type of damage.
   * @param {string[]} [opts.types] The types of damage.
   * @param {string} [opts.bonus] The bonus to apply to the damage.
   * @param {string} [opts.scalingMode] The scaling mode to apply to the damage.
   * @param {number} [opts.scalingNumber] The scaling number to apply to the damage.
   * @param {string} [opts.scalingFormula] The scaling formula to apply to the damage.
   * @param {string} [opts.customFormula] The custom formula to apply to the damage.
   * @returns {DDBDamagePart} The created damage part.
   */
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

  get useMidiAutomations() {
    if (!DDBEnricherData.AutoEffects.effectModules().midiQolInstalled) return false;
    return this.ddbParser.useMidiAutomations ?? false;
  }

  constructor({ ddbEnricher }) {
    this.ddbEnricher = ddbEnricher;
    this.ddbParser = ddbEnricher.ddbParser;
    this.is2014 = ddbEnricher.is2014;
    this.is2024 = ddbEnricher.is2024;
    this.useLookupName = ddbEnricher.useLookupName;
    this.activityGenerator = ddbEnricher.activityGenerator;
    this.effectType = ddbEnricher.effectType;
    this.document = ddbEnricher.document;
    this.name = ddbEnricher.name;
    this.isCustomAction = ddbEnricher.isCustomAction;
    this.manager = ddbEnricher.manager;
  }

  get featureType() {
    return foundry.utils.getProperty(this.data, "flags.ddbimporter.type");
  }

  /**
   * activity type - if type is none, activity hit will be generally undefined
   * @returns {string}
   */
  get type() {
    return null;
  }

  get data() {
    return this.ddbEnricher.ddbParser.data;
  }


  /**
   * This is the activity property that is used to make adjustments to the activity.
   * @returns {DDBActivityData | null}
   */
  get activity() {
    return null;
  }

  // {Function} summons function to call when generateSummons is true
  get summonsFunction() {
    return null;
  }

  // generateSummons: {boolean} during spell parsing will call the summonsFunction
  get generateSummons() {
    return false;
  }

  /**
   * Generates a collection of effects with specific properties and configurations.
   * Each effect can modify attributes such as type, name, data, and various changes.
   * Additional options include magical bonuses, status effects, and integration with
   * external systems like ATL or MIDI. Some effects are only generated if certain
   * conditions, such as having MIDI-QOL installed, are met.
   * @returns {DDBEffectHint[]}
   */
  get effects() {
    return [];
  }

  /**
   * Provides an override configuration for the document.
   * @returns {DDBOverrideData | null}
   */
  get override() {
    return null;
  }

  /**
   * Gets additional activities to be added to the document. This is generally
   * used to add additional abilities that are not directly related to the
   * document.
   * @returns {DDBAdditionalActivity[] | null}
   */
  get additionalActivities() {
    return null;
  }

  /**
   * Gets additional advancements to be added to the document.
   * @returns {object[]} An array of advancements.
   */
  get additionalAdvancements() {
    return [];
  }

  /**
   * Provides an override configuration for the document.
   * @returns {DDBDocumentStub | null}
   */
  get documentStub() {
    return null;
  }

  get usesOnActivity() {
    return false;
  }

  // a hint to clear any generated auto effects before processing effect hints on the enricher
  get clearAutoEffects() {
    return false;
  }

  get useDefaultAdditionalActivities() {
    return false;
  }

  get addToDefaultAdditionalActivities() {
    return false;
  }

  get addAutoAdditionalActivities() {
    return true;
  }

  get builtFeaturesFromActionFilters() {
    return [];
  }

  get stopDefaultActivity() {
    return false;
  }

  get parseAllChoiceFeatures() {
    return false;
  }

  /**
   * Add item macro using DDBMacros.setItemMacroFlag.
   * @returns {DDBItemMacro | null}
   */
  get itemMacro() {
    return null;
  }

  /**
   * Sets the midi on use macro flag using DDBMacros.setMidiOnUseMacroFlag.
   * @returns {DDBSetMidiOnUseMacroFlag | null}
   */
  get setMidiOnUseMacroFlag() {
    return null;
  }

  get combineGrantedDamageModifiers() {
    return false;
  }

  get combineDamageTypes() {
    return false;
  }

  // eslint-disable-next-line no-unused-vars, no-empty-function
  async customFunction(options = {}) {
    // noop
  }

  // eslint-disable-next-line no-unused-vars
  async cleanup(options = {}) {
    // noop
  }

  /**
   * Adds a description about the DDBMacro
   * @returns {DDBMacroDescriptionData | null}
   */
  get ddbMacroDescriptionData() {
    return null;
  }

  get noVersatile() {
    return false;
  }

  get choiceComponentFeatureName() {
    return null;
  }

}
