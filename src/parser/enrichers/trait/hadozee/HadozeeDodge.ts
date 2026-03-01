import DDBEnricherData from "../../data/DDBEnricherData";

export default class HadozeeDodge extends DDBEnricherData {

  get type() {
    if (!this.isAction) return null;
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    if (!this.isAction) return null;
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
    if (!this.isAction) return [];
    return [
      {
        midiOnly: true,
        name: "Hadozee Dodge",
        daeSpecialDurations: ["1Reaction" as const],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1d6 + @attributes.prof", 20, "system.traits.dm.midi.all"),
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
