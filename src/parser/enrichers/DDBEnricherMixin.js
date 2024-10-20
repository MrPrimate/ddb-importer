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

  get data() {
    return this.ddbEnricher.ddbParser.data;
  }

  get activity() {
    return null;
  }

  get effect() {
    return null;
  }

  get override() {
    return null;
  }

  get additionalActivities() {
    return null;
  }

  get documentStub() {
    return null;
  }

}

// DDBEnricherMixin.prototype.effectModules = effectModules;
// DDBEnricherMixin.prototype.generateATLChange = generateATLChange;
// DDBEnricherMixin.prototype.generateCustomChange = generateCustomChange;
// DDBEnricherMixin.prototype.generateDowngradeChange = generateDowngradeChange;
// DDBEnricherMixin.prototype.generateOverrideChange = generateOverrideChange;
// DDBEnricherMixin.prototype.generateSignedAddChange = generateSignedAddChange;
// DDBEnricherMixin.prototype.generateUnsignedAddChange = generateUnsignedAddChange;
// DDBEnricherMixin.prototype.generateUpgradeChange = generateUpgradeChange;
