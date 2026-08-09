import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneShotOption extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData | null {
    return {
      data: {
        damage: {
          onSave: "full",
          critical: { allow: true },
        },
        range: {
          value: null,
          units: "spec",
        },
      },
    };
  }

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get addToDefaultAdditionalActivities() {
    return false;
  }

  override get addAutoAdditionalActivities() {
    return true;
  }

  override get builtFeaturesFromActionFilters() {
    return [this.name];
  }

}
