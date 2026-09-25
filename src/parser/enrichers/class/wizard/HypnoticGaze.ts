import DDBEnricherData from "../../data/DDBEnricherData";

export default class HypnoticGaze extends DDBEnricherData {

  get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  // a subsequent action maintains the effect; re-using the activity covers that, the once per
  // long rest per creature restriction is left to the players
  get activity(): IDDBActivityData {
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hypnotised",
        statuses: ["charmed", "incapacitated"],
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 90, "system.attributes.movement.all"),
          ...["walk", "fly", "swim", "climb", "burrow"].map((mode) =>
            DDBEnricherData.ChangeHelper.overrideChange("0", 90, `system.attributes.movement.${mode}`),
          ),
        ],
        options: {
          expiry: "sourceEnd",
          description: "Charmed, Incapacitated, speed 0 and visibly dazed until the end of the wizard's next turn. Ends early if the wizard moves more than 5 feet away, the creature can neither see nor hear the wizard, or it takes damage.",
        },
        daeSpecialDurations: ["isDamaged"],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "",
        recovery: [],
      },
    };
  }

}
