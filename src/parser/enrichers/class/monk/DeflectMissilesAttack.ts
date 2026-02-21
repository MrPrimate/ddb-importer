import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeflectMissilesAttack extends DDBEnricherData {
  get activity() {
    return {
      activationType: "special",
      targetType: "creature",
      data: {
        "damage.parts": [
          DDBEnricherData.basicDamagePart({
            customFormula: "@scale.monk.die.die + @abilities.dex.mod",
            types: DDBEnricherData.allDamageTypes(),
          }),
        ],
      },
    };
  }

  get override() {
    return {
      midiManualReaction: true,
    };
  }
}
