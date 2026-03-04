import DDBEnricherData from "../../data/DDBEnricherData";

export default class TotemSpiritEagle extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Dash",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "bonus",
          },
          targetOverride: {
            affects: {
              type: "self",
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Totem Spirit: Eagle",
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
