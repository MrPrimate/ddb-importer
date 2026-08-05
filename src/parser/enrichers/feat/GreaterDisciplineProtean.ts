import DDBEnricherData from "../data/DDBEnricherData";

export default class GreaterDisciplineProtean extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
      itemConsumeValue: "2",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        // extra damage applies only to Unarmed Strikes, so the change is
        // conditional and AC5e-gated rather than a blanket mwak bonus
        name: "Protean: Rending Claws",
        options: {
          durationSeconds: 60,
          description: "Your Unarmed Strike hits deal an extra 2d6 Slashing damage.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange("bonus=2d6[slashing]; item.name.includes(\"Unarmed\")", 20, "flags.automated-conditions-5e.damage.bonus"),
        ],
      },
    ];
  }

}
