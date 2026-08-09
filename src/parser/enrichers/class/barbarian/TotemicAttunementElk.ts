import DDBEnricherData from "../../data/DDBEnricherData";

export default class TotemicAttunementElk extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      name: "Activate",
      activationType: "special",
      data: {
        duration: this.is2014
          ? { units: "minute", value: "1" }
          : { units: "minute", value: "10" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Totemic Attunement: Elk",
        options: {
          transfer: true,
          disabled: true,
          durationSeconds: this.is2014 ? 60 : 600,
          description: this.ddbEnricher.data.system.description?.value,
        },
        activityMatch: "Activate",
      },
    ];
  }

}
