import DDBEnricherData from "../../data/DDBEnricherData";

export default class AntlerDefence extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Antler Defence",
        options: {
          durationRounds: 1,
          description: "+2 bonus to AC against melee attacks until the start of your next turn.",
        },
        daeSpecialDurations: ["turnStartSource"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
