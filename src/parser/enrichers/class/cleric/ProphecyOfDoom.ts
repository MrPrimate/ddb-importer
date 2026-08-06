import DDBEnricherData from "../../data/DDBEnricherData";

export default class ProphecyOfDoom extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      data: {
        range: {
          units: "ft",
          value: "120",
        },
        target: {
          template: {
            size: "15",
            units: "ft",
            type: "radius",
          },
        },
      },
    };
  }

}
