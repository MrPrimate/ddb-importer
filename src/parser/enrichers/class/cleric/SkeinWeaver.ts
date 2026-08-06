import DDBEnricherData from "../../data/DDBEnricherData";

export default class SkeinWeaver extends DDBEnricherData {

  get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "enemy",
      activationType: "special",
      activationCondition: "When you use your Plucking at Threads feature",
      rangeSelf: true,
      data: {
        save: {
          ability: ["cha"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        target: {
          template: {
            size: "30",
            units: "ft",
            type: "radius",
          },
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Skein Weaver: Fate's Disfavor",
        options: {
          durationSeconds: 60,
          description: "Disadvantage on attack rolls and saving throws for 1 minute. Repeat the saving throw at the end of each turn, ending the effect on a success.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.save.all"),
        ],
      },
    ];
  }

}
