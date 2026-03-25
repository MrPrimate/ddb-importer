import DDBEnricherData from "../../data/DDBEnricherData";

export default class SearingArcStrike extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Burning Hands",
      addItemConsume: true,
      itemConsumeTargetName: this.is2014 ? "Ki" : "Monk's Focus",
      itemConsumeValue: 2,
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        spell: {
          spellbook: true,
        },
        consumption: {
          spellSlot: true,
          scaling: {
            allowed: true,
            max: "@classes.monk.levels",
          },
        },
      },
    };
  }
}
