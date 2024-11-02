import { effectModules, generateATLChange, generateCustomChange, generateDowngradeChange, generateOverrideChange, generateSignedAddChange, generateUnsignedAddChange, generateUpgradeChange } from "../../effects/effects.js";
import DDBHelper from "../../lib/DDBHelper.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

/* eslint-disable class-methods-use-this */
export default class DDBEnricherMixin {

  static META_DATA = {

  };

  hasClassFeature({ featureName, className = null, subClassName = null } = {}) {
    if (!this.ddbParser?.ddbData) return false;

    const result = this.ddbParser.ddbData.character.classes.some((klass) =>
      klass.classFeatures.some((feature) => feature.definition.name === featureName && klass.level >= feature.definition.requiredLevel)
      && ((className === null || klass.definition.name === className)
        && (subClassName === null || klass.subclassDefinition?.name === subClassName)),
    );

    return result;
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

  _buildDamagePartsWithBase() {
    const original = this.ddbEnricher.originalActivity;

    const base = foundry.utils.deepClone(this.data.system.damage.base);
    const parts = foundry.utils.deepClone(original?.damage.parts ?? []);
    return [base, ...parts];
  }

  static effectModules = effectModules;

  static generateATLChange = generateATLChange;

  static generateCustomChange = generateCustomChange;

  static generateDowngradeChange = generateDowngradeChange;

  static generateOverrideChange = generateOverrideChange;

  static generateSignedAddChange = generateSignedAddChange;

  static generateUnsignedAddChange = generateUnsignedAddChange;

  static generateUpgradeChange = generateUpgradeChange;

  static basicDamagePart = DDBBaseEnricher.basicDamagePart;

  static allDamageTypes = DDBBaseEnricher.allDamageTypes;

  get movementChange() {
    return game.modules.get("dae")?.active
      ? DDBEnricherMixin.generateUpgradeChange
      : DDBEnricherMixin.generateCustomChange;
  }

  constructor({ ddbEnricher }) {
    this.ddbEnricher = ddbEnricher;
    this.ddbParser = ddbEnricher.ddbParser;
    this.is2014 = ddbEnricher.is2014;
    this.is2024 = ddbEnricher.is2024;
    this.useLookupName = ddbEnricher.useLookupName;
    this.additionalActivityClass = ddbEnricher.additionalActivityClass;
    this.effectType = ddbEnricher.effectType;
    this.document = ddbEnricher.document;
    this.name = ddbEnricher.name;
    this.isCustomAction = ddbEnricher.isCustomAction;
    this.manager = ddbEnricher.manager;
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
   *   addSpellSlotConsume: {boolean} Add spell slot consume.
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
   *   damageParts: {object[]} Adds damage parts.
   *   data: {object} Merge this with activity data.
   *   func: {function} Run this function passing in the activity as the only variable.
   *   allowMagical: {boolean} Allow magical restrictions.
   *   addSingleFreeUse: {boolean} Duplicates activity and adds single free use consumption activity.
   *   addSingleFreeRecoveryPeriod: {string} Single free use recovery period.
   *   additionalDamageIncludeBase: {boolean} Add additional damage include base.
   */
  get activity() {
    return null;
  }

  /**
   * Gets additional effects to be added to the document. This is generally used
   * to add additional abilities that are not directly related to the document.
   * @returns {object} An object with the following properties:
   *   noCreate: {boolean} If true, prevents the call to generate effect.
   *   type: {string} If effect base type does not match spell/feat etc
   *   name: {string} Override auto name generation
   *   data: {object} Merge with effect data
   *   changes: {object[]} Merge with effect changes
   *   multiple: {object[]} Nest this for multiple effects
   *   options: {object} Passed to the ddb effect generator
   *   magicalBonus: {object} Add magical bonus
   *   statuses: {object[]} Add status effects
   *   atlChanges: {object[]} Adds atl changes if atl active
   *   tokenMagicChanges: {object[]} Adds token magic changes
   *   midiChanges: {object[]} Adds midi changes
   *   func: {function} Run this funciton passing in the activity as the only variable
   *   descriptionHint: {string} Adds enchantment description hint
   *   descriptionSuffix: {string} Append to item description
   *   clearAutoEffects: {boolean} Clear auto effects
   *   midiOnly: {boolean} only generate this effect if midi qol is installed
   */
  get effect() {
    return null;
  }

  /**
   * Provides an override configuration for the document.
   * @returns {object} An object with the following properties:
   *   noTemplate: {boolean} If true, removes the document template.
   *   data: {object} Data to be merged with the document data.
   *   descriptionSuffix: {string} A suffix to be appended to the document description.
   *   replaceActivityUses: {boolean} If true, replaces activity uses with matched parent in target
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

}
