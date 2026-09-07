import DDBEnricherData from "../../data/DDBEnricherData";

export default class AntlerDefence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Antler Defence",
        options: {
          expiry: "sourceStart",
          description: "+2 bonus to AC against melee attacks until the start of your next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
