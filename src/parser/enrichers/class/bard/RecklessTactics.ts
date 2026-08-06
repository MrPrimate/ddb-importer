import DDBEnricherData from "../../data/DDBEnricherData";

export default class RecklessTactics extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You attack with a Heavy, Two-Handed, or Versatile melee weapon",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "Gain Advantage on the attack and add the rolled bonus to its damage; attacks against you have Advantage this round.",
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.road.travelers-tricks + max(1, @abilities.wis.mod)",
          name: "Bonus weapon damage",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Reckless Tactics",
        options: {
          durationRounds: 1,
          description: "Advantage on this attack; attack rolls against you have Advantage until the start of your next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.mwak"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
      },
    ];
  }

}
