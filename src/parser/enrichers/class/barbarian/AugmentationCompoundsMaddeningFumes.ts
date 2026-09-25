import DDBEnricherData from "../../data/DDBEnricherData";

export default class AugmentationCompoundsMaddeningFumes extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        target: {
          override: true,
          affects: {
            type: "enemy",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "30",
            units: "ft",
          },
        },
        save: {
          ability: ["wis"],
          dc: {
            calculation: "",
            formula: "8 + @abilities.con.mod + @prof",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Maddening Fumes: Aggression",
        // "until the start of its next turn" on the affected creature
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          expiry: "targetStart",
          description: "Disadvantage on attack rolls against targets other than the barbarian until the start of its next turn (the exemption for attacks against the barbarian is manual).",
        },
      },
    ];
  }

}
