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

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return true;
  }

  override get builtFeaturesFromActionFilters(): any[] {
    return [this.name];
  }

}
