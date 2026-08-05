import DDBEnricherData from "../../data/DDBEnricherData";

export default class CarrierOfRot extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "action",
      data: {
        save: {
          ability: ["con"],
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        range: {
          units: "ft",
          value: "10",
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              // 1d4, +1d4 at levels 6, 11 and 16
              customFormula: "(1 + floor((@details.level + 4) / 5))d4",
              types: ["necrotic"],
            }),
          ],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Rotting",
        options: {
          durationSeconds: 60,
          description: "Takes 1d4 Necrotic damage at the end of each of its turns. A DC save-DC Wisdom (Medicine) check by the target or an adjacent creature, or any magical healing, removes the rot.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Carrier of Rot,turn=end,damageRoll=1d4[necrotic],damageType=necrotic",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
