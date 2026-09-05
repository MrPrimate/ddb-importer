import DDBEnricherData from "../../data/DDBEnricherData";

export default class HypnoticGaze extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  // a subsequent action maintains the effect; re-using the activity covers that, the once per
  // long rest per creature restriction is left to the players
  override get activity(): IDDBActivityData {
    return {
      name: "Hypnotic Gaze",
      activationType: "action",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 5,
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hypnotised",
        statuses: ["charmed", "incapacitated"],
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0"),
        ],
        options: {
          expiry: "sourceEnd",
          description: "Charmed, Incapacitated, speed 0 and visibly dazed until the end of the wizard's next turn. Ends early if the wizard moves more than 5 feet away, the creature can neither see nor hear the wizard, or it takes damage.",
        },
        daeSpecialDurations: ["isDamaged"],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "",
        recovery: [],
      },
    };
  }

}
