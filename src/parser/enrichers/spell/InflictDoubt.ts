import DDBEnricherData from "../data/DDBEnricherData";

export default class InflictDoubt extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Doubt",
        midiChanges: [DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.all")],
        ac5eChanges: [DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.d20.disadvantage")],
        options: { durationSeconds: 60, description: "Disadvantage on D20 Tests." },
      },
    ];
  }

}
