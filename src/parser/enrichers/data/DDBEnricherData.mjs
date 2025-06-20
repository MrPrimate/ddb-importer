import { DICTIONARY } from "../../../config/_module.mjs";
import { DDBDataUtils } from "../../lib/_module.mjs";
import { AutoEffects, ChangeHelper } from "../effects/_module.mjs";

/* eslint-disable class-methods-use-this */
export default class DDBEnricherData {

  static META_DATA = {};

  static AutoEffects = AutoEffects;

  static ChangeHelper = ChangeHelper;

  getFeatureActionsName({ type = null } = {}) {
    return this.ddbEnricher.getFeatureActionsName({ type });
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

  hasAction({ name, type } = {}) {
    return this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      a.name === name,
    );
  }

  _getSpentValue(type, name, matchSubClass = null) {
    const spent = this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      a.name === name
    && (matchSubClass === null
      || DDBDataUtils.findSubClassByFeatureId(this.ddbParser.ddbData, a.componentId) === matchSubClass),
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

  get movementChange() {
    return AutoEffects.effectModules().daeInstalled
      ? ChangeHelper.upgradeChange
      : ChangeHelper.customChange;
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
   * @returns {object} An object with the following properties:
   *   name: {string} The name of the activity. If not type default.
   *   type: {string} The type of the activity. If not type default, set to none.
   *   parent: {string} The name of the lookup parent if only applies to certain types.
   *   noConsumeTargets: {boolean} Remove any auto generated consumption targets.
   *   addItemConsume: {boolean} Add item consume.
   *   itemConsumeTargetName: "Item Name", // item consume target name
   *   itemConsumeValue: {number} The item consume value if not 1.
   *   addScalingMode: {string} Add scaling mode to item consume.
   *   addScalingFormula: {string} Add scaling formula to item consume.
   *   addActivityConsume: {boolean} Add activity consume.
   *   activityConsumeValue: {number} The activity consume value if not 1.
   *   addActivityScalingMode: {string} Add scaling mode to activity consume.
   *   addActivityScalingFormula: {string} Add scaling formula to activity consume.
   *   addSpellSlotConsume: {boolean} Add spell slot consume. (as a consumption target)
   *   removeSpellSlotConsume: {boolean} Remove spell slot consume (for spells)
   *   spellSlotConsumeValue: {number} The spell slot consume value if not 1.
   *   addSpellSlotScalingMode: {string} Add scaling mode to spell slot consume.
   *   addSpellSlotScalingFormula: {string} Add scaling formula to spell slot consume.
   *   additionalConsumptionTargets: {object[]} Add additional consumption targets.
   *   addConsumptionScalingMax: {string} Enable consumption scaling and add max.
   *   targetType: {string} Target type override.
   *   rangeSelf: {boolean} Set range self.
   *   noTemplate: {boolean} Remove target template.
   *   overrideTemplate: {boolean} Add override target template.
   *   overrideRange: {boolean} Add override range.
   *   activationType: {string} Activation type.
   *   activationCondition: {string} Activation condition.
   *   overrideActivation: {boolean} Add override activation.
   *   midiManualReaction: {boolean} Add midi manual reaction.
   *   flatAttack: {string} Flat attack value, sets flat attack for activity.
   *   removeDamageParts: {boolean} remove existing damage parts
   *   damageParts: {object[]} Adds damage parts.
   *   data: {object} Merge this with activity data.
   *   func: {function} Run this function passing in the activity as the only variable.
   *   allowMagical: {boolean} Allow magical restrictions.
   *   addSingleFreeUse: {boolean} Duplicates activity and adds single free use consumption activity.
   *   addSingleFreeRecoveryPeriod: {string} Single free use recovery period.
   *   additionalDamageIncludeBase: {boolean} Add additional damage include base.
   *   stopHealSpellActivity: {boolean} in spells prevents healing activity auto generation
   *   profileKeys: {Array} array of summon profile keys to use
   *   summons: {object} data to merge to summon config
   *   splitDamage: {boolean} used by the spell parser to split damage
   *   addSpellUuid: {boolean} add spell uuid to activity
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
   *
   * @returns {object} An object containing:
   *   - effects: {Array} A list of effect objects with the following properties:
   *     - noCreate: {boolean} If true, prevents the creation of the effect, using an auto-generated one instead.
   *     - type: {string} Specifies the type of effect, e.g., "enchant".
   *     - name: {string} Overrides the auto-generated name for the effect.
   *     - data: {object} Data to merge with the effect's data.
   *     - changes: {Array} Modifications to merge with the effect's changes.
   *     - options: {object} Configuration options passed to the DDB effect generator, including descriptions and durations.
   *     - magicalBonus: {object} Includes details for adding a magical bonus.
   *     - statuses: {Array} Status effects to add.
   *     - atlChanges: {Array} ATL changes, if ATL is active.
   *     - tokenMagicChanges: {Array} Token magic changes.
   *     - daeStackable: {string} set stackable dae value
   *     - daeSpecialDurations: {Array} adds dae special durations
   *     - midiChanges: {Array} MIDI changes.
   *     - midiProperties: {object} MIDI properties.
   *     - daeChanges: {Array} DAE changes.
   *     - func: {function} A function executed with the activity as the sole argument.
   *     - descriptionHint: {string} A hint for the enchantment description.
   *     - activeAurasOnly: {boolean} Indicates that the effect is generated only if ActiveAuras is installed.
   *     - activityMatch: {string} Match to this activity only
   *     - activitiesMatch: {Array} Match to only these activities
   *     - macroChanges: {Array} Add macro changes using DDBMacros.generateMacroChange
   *     - targetUpdateMacroChanges:  {Array} onTargetUpdate macro changes
   *     - onUseMacroChanges: {Array} onUse macro changes
   *     - damageBonusMacroChanges: {Array} damage bonus macro changes
   *     - midiOptionalChanges: {Array} object of name and data (key/value) for midi optional changes
   *     - optionalMacroChanges: {Array} optional macro changes for midi optional macros.
   *     - daeOnly: {boolean} only add effect if dae is active
   *     - atlOnly: {boolean} only add effect if atl is active
   *     - midiOnly: {boolean} only add effect if MIDI-QOL is installed.
   *     - activeAurasOnly: {boolean} only add effect if ActiveAuras is installed.
   *     - daeNever: {boolean} never add effect if dae is active
   *     - atlNever: {boolean} never add effect if atl is active
   *     - midiNever: {boolean} never add effect if MIDI-QOL is installed.
   *     - activeAurasNever: {boolean} never add effect if ActiveAuras is installed.
   *     - auraeffectsOnly: {boolean} only add effect if aura effects is active
   *     - auraeffectsNever: {boolean} never add effect if aura effects is active
   *     - auraeffects: {object} aura effects data
   */
  get effects() {
    return [];
  }

  /**
   * Provides an override configuration for the document.
   * @returns {object} An object with the following properties:
   *   noTemplate: {boolean} If true, removes the document template.
   *   data: {object} Data to be merged with the document data.
   *   descriptionSuffix: {string} A suffix to be appended to the document description.
   *   replaceActivityUses: {boolean} If true, replaces activity uses with matched parent in target
   *   func: {function} Run this function passing in the enricher as a variable in teh params object
   */
  get override() {
    return null;
  }

  /**
   * Gets additional activities to be added to the document. This is generally
   * used to add additional abilities that are not directly related to the
   * document.
   * @returns {object[]} An array of objects with the following properties:
   *   action: {object} An object representing the activity to be duplicated.
   *   overrides: {object} An object with overrides for the activity.
   *   duplicate: {boolean} Duplicate the items first activity
   */
  get additionalActivities() {
    return null;
  }

  /**
   * Provides an override configuration for the document.
   * @returns {object} An object with the following properties:
   *   stopDefaultActivity: {boolean} If true, prevents the call to generate activity.
   *   data: {object} Data to be merged with the document data.
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

  get stopDefaultActivity() {
    return false;
  }

  get parseAllChoiceFeatures() {
    return false;
  }

  // Add item macro using DDBMacros.setItemMacroFlag
  get itemMacro() {
    return null;
  }

  get setMidiOnUseMacroFlag() {
    return null;
  }

  get combineGrantedDamageModifiers() {
    return false;
  }

  // eslint-disable-next-line no-unused-vars, no-empty-function
  customFunction(options = {}) {

  }

  // return {
  //   name: "fontOfMagic",
  //   label: "Font of Magic Macro",
  //   type: "spell",
  //   parameters: "",
  // };
  get ddbMacroDescriptionData() {
    return null;
  }

  get noVersatile() {
    return false;
  }

}
