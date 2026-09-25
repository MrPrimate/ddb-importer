import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Eldritch Strike",
      activationType: "special",
      activationCondition: "When you hit a creature with a weapon attack",
      targetType: "creature",
      noTemplate: true,
      data: {
        range: {
          units: "spec",
        },
      },
    };
  }

  // the feature only covers saves against the fighter's own spells, which the module flags
  // cannot see, so the disadvantage is unconditional and DAE ends it after one save
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Struck",
        options: {
          expiry: "sourceEnd",
          description: "Disadvantage on the next saving throw against a spell the fighter casts, until the end of the fighter's next turn.",
        },
        daeSpecialDurations: ["isSave"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.save.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.save.disadvantage"),
        ],
      },
    ];
  }

}
