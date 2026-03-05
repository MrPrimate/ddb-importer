import DDBEnricherData from "../data/DDBEnricherData";

export default class Telekinetic extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.NONE,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Telekinetic Shove", type: "feat", rename: ["Shove"] } },
      { action: { name: "Telekinetic: Shove", type: "feat", rename: ["Shove"] } },
    ];
  }

}
