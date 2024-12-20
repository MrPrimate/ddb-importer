/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HadozeeDodge extends DDBEnricherData {

  get type() {
    if (!this.action) return null;
    return "heal";
  }

  get activity() {
    if (!this.action) return null;
    return {
      name: "Reduce Damage",
      targetType: "self",
      type: "heal",
      data: {
        "consumption.targets": [],
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "1d6 + @attributes.prof",
          types: ["healing"],
        }),
      },
    };
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects() {
    if (!this.action) return [];
    return [
      {
        midiOnly: true,
        name: "Hadozee Dodge",
        daeSpecialDurations: ["1Reaction"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1d6 + @attributes.prof", 20, "flags.midi-qol.DR.all"),
        ],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      midiDamageReaction: true,
    };
  }

}
