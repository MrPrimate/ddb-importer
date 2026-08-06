import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShadowGrasp extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.SAVE : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Dealing Sneak Attack damage",
      data: {
        save: {
          ability: ["dex"],
          dc: {
            calculation: "",
            formula: "8 + @prof + @abilities.dex.mod",
          },
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Shadow Grasp",
        statuses: ["Restrained"],
        options: {
          durationSeconds: 60,
          description: "Restrained for 1 minute; repeats the saving throw at the end of each of its turns, ending the effect on a success.",
        },
      },
    ];
  }

}
