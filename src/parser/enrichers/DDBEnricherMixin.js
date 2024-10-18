/* eslint-disable class-methods-use-this */
export default class DDBEnricherMixin {

  hasClassFeature({ featureName, className = null, subClassName = null } = {}) {
    if (!this.ddbParser?.ddbData) return false;

    const result = this.ddbParser.ddbData.character.classes.some((klass) =>
      klass.classFeatures.some((feature) => feature.definition.name === featureName && klass.level >= feature.definition.requiredLevel)
      && ((className === null || klass.definition.name === className)
        && (subClassName === null || klass.subclassDefinition?.name === subClassName)),
    );

    return result;
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

  get data() {
    return this.ddbParser?.data ?? this.document;
  }


  activity() {
    return null;
  }

  effect() {
    return null;
  }

  override() {
    return null;
  }

  additionalActivities() {
    return null;
  }

  documentStub() {
    return null;
  }

}
