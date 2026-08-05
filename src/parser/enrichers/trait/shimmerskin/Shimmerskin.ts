import DDBEnricherData from "../../data/DDBEnricherData";

export default class Shimmerskin extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shimmering Skin",
        options: {
          durationSeconds: 600,
          description: "Advantage on all Charisma checks.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.check.cha"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange("ability.cha", 20, "flags.automated-conditions-5e.check.advantage"),
        ],
      },
    ];
  }

}
