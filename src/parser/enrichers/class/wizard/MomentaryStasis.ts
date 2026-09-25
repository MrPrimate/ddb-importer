import DDBEnricherData from "../../data/DDBEnricherData";

export default class MomentaryStasis extends DDBEnricherData {

  get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  // Large or smaller only, which the target filter cannot express; the condition carries it
  get activity(): IDDBActivityData {
    return {
      name: "Momentary Stasis",
      activationType: "action",
      activationCondition: "Target must be Large or smaller",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 60,
      addItemConsume: true,
      data: {
        save: {
          ability: ["con"],
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
        name: "Momentary Stasis",
        options: {
          expiry: "sourceEnd",
          description: "Incapacitated with a speed of 0 until the end of the wizard's next turn. Ends early if the creature takes damage.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 90, "system.attributes.movement.all"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.swim"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.climb"),
        ],
        statuses: ["Incapacitated"],
        daeSpecialDurations: ["isDamaged"],
      },
    ];
  }

}
