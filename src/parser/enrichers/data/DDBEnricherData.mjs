import { DICTIONARY } from "../../../config/_module.mjs";
import { logger } from "../../../lib/_module.mjs";
import { DDBDataUtils } from "../../lib/_module.mjs";
import CharacterSpellFactory from "../../spells/CharacterSpellFactory.js";
import DDBSpell from "../../spells/DDBSpell.js";
import { AutoEffects, ChangeHelper } from "../effects/_module.mjs";

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
   * @returns {import("./DDBEnricherData.d.ts").DDBDamagePart} The created damage part.
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
   * @returns {import("./DDBEnricherData.d.ts").DDBActivityData | null}
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
   * @returns {import("./DDBEnricherData.d.ts").DDBEffectHint[]}
   */
  get effects() {
    return [];
  }

  /**
   * Provides an override configuration for the document.
   * @returns {import("./DDBEnricherData.d.ts").DDBOverrideData | null}
   */
  get override() {
    return null;
  }

  /**
   * Gets additional activities to be added to the document. This is generally
   * used to add additional abilities that are not directly related to the
   * document.
   * @returns {import("./DDBEnricherData.d.ts").DDBAdditionalActivity[] | null}
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
   * @returns {import("./DDBEnricherData.d.ts").DDBDocumentStub | null}
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
   * @returns {import("./DDBEnricherData.d.ts").DDBItemMacro | null}
   */
  get itemMacro() {
    return null;
  }

  /**
   * Sets the midi on use macro flag using DDBMacros.setMidiOnUseMacroFlag.
   * @returns {import("./DDBEnricherData.d.ts").DDBSetMidiOnUseMacroFlag | null}
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
   * @returns {import("./DDBEnricherData.d.ts").DDBMacroDescriptionData | null}
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
