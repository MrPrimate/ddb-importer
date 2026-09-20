import DDBEnricherData from "../../data/DDBEnricherData";

export default class FrigidExplorer extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn",
      func: ({ activity }: { activity: IActivityData }) => {
        for (const part of activity.damage?.parts ?? []) {
          part.types = ["cold"];
        }
      },
      data: {
        range: {
          units: "spec",
        },
      },
    };
  }

}
