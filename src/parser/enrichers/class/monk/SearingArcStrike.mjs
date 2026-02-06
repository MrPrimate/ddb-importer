/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SearingArcStrike extends DDBEnricherData {

  get type() {
    return "cast";
  }

  get activity() {
    return {
      addSpellUuid: "Burning Hands",
      addItemConsume: true,
      itemConsumeTargetName: "Ki",
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
