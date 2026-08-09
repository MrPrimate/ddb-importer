import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeflectMissilesAttack extends DDBEnricherData {
  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.die.die + @abilities.dex.mod",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      midiManualReaction: true,
    };
  }
}
