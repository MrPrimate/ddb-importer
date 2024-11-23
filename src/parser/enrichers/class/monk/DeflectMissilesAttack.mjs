/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DeflectMissilesAttack extends DDBEnricherData {
  get activity() {
    return {
      activationType: "special",
      targetType: "creature",
      data: {
        "damage.parts": [
          DDBEnricherData.basicDamagePart({
            customFormula: "@scale.monk.martial-arts.die + @abilities.dex.mod",
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
