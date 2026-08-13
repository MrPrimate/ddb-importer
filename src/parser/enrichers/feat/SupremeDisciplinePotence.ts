import DDBEnricherData from "../data/DDBEnricherData";

export default class SupremeDisciplinePotence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
      itemConsumeValue: "2",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Potence: Overwhelming Might",
        options: {
          durationSeconds: 60,
          description: "You have Advantage on attack rolls using Strength; while you have that Advantage you can reroll one of the dice once.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.str"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("ability.str", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
