import DDBEnricherData from "../data/DDBEnricherData";

export default class GreaterDisciplinePotence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
      itemConsumeValue: "2",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Potence: Empowered Strikes",
        options: {
          durationSeconds: 60,
          description: "Your Melee weapon and Unarmed Strike hits deal an extra 1d10 Force damage; double damage to objects and structures.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d10[force]", 20, "system.bonuses.mwak.damage"),
        ],
      },
    ];
  }

}
