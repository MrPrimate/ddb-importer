import DDBEnricherData from "../../data/DDBEnricherData";

export default class TotemSpiritWolf extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      name: "Activate",
      activationType: "special",
      data: {
        duration: this.is2014
          ? { units: "second", value: "60" }
          : { units: "minute", value: "10" },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Totem Spirit: Wolf",
        options: {
          transfer: true,
          disabled: true,
          durationSeconds: this.is2014 ? 60 : 600,
          description: this.ddbEnricher.data.system.description.value,
        },
        activityMatch: "Activate",
      },
    ];
  }

}
