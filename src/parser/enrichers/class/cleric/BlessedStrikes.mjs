/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BlessedStrikes extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      noeffect: true,
      activationOverride: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "1d8",
              types: ["radiant"],
            }),
          ],
        },
      },
    };
  }

  get effects() {
    return [
      {
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(`${document.name} Bonus Damage`, 5, "flags.midi-qol.optional.blessedstrikes.label"),
          DDBEnricherData.ChangeHelper.customChange("each-round", 5, "flags.midi-qol.optional.blessedstrikes.count"),
          DDBEnricherData.ChangeHelper.customChange("1d8", 5, "flags.midi-qol.optional.blessedstrikes.damage.all"),
        ],
      },
    ];
  }
}
