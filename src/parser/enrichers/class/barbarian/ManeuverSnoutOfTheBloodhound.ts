import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverSnoutOfTheBloodhound extends DDBEnricherData {


  override get builtFeaturesFromActionFilters(): string[] {
    return ["Snout of the Bloodhound: Activate"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Attune Senses",
      activationType: "minute",
      activationValue: 1,
      targetType: "self",
      data: {
        duration: {
          units: "hour",
          value: "1",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Snout of the Bloodhound",
        activityMatch: "Attune Senses",
        options: {
          durationSeconds: 3600,
          description: "Advantage on Wisdom (Perception) and Wisdom (Survival) checks to track, and you do not have disadvantage on attack rolls against invisible creatures.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@prof", 20, "system.attributes.init.roll.bonus"),
          DDBEnricherData.ChangeHelper.advantageSkillChange("prc"),
          DDBEnricherData.ChangeHelper.advantageSkillChange("sur"),
        ],
      },
    ];
  }

}
