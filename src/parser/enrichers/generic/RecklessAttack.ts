import DDBEnricherData from "../data/DDBEnricherData";

export default class RecklessAttack extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "self",
      rangeSelf: true,
      data: {
        duration: {
          units: "turn",
          value: "1",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // single effect: advantage on your Strength-based attacks, and attacks
        // against you have advantage until the start of your next turn
        name: "Attacking Recklessly",
        daeStackable: "noneName",
        options: { expiry: "sourceStart" },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.advantage.attack.str"),
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.advantage"),
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.grants.attack.advantage"),
        ],
      },
    ];
  }
}
