import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverHibernatingBearRecuperation extends DDBEnricherData {


  override get builtFeaturesFromActionFilters(): string[] {
    return ["Hibernating Bear Recuperation: Fall Asleep"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Fall Asleep",
      activationType: "action",
      targetType: "self",
      noConsumeTargets: true,
      addItemConsume: true,
      itemConsumeTargetName: "maneuver-points",
      itemConsumeValue: 5,
      data: {
        duration: {
          units: "minute",
          value: "10",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hibernating",
        options: {
          durationSeconds: 600,
          description: "You have resistance to all damage except psychic.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("acid", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.addChange("bludgeoning", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.addChange("cold", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.addChange("fire", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.addChange("force", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.addChange("lightning", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.addChange("necrotic", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.addChange("piercing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.addChange("poison", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.addChange("radiant", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.addChange("slashing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.addChange("thunder", 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
