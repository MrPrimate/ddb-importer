import DDBEnricherData from "../data/DDBEnricherData";

export default class GlyphOfWarding extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: this.is2014 ? "Explosive Runes" : "Explosive Rune",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 5,
              denomination: 8,
              types: ["acid", "cold", "fire", "lightning", "thunder"],
              scalingFormula: "1",
              scalingMode: "whole",
            }),
          ],
        },
      },
    };
  }

  // a spell glyph stores another spell instead of rolling the explosive damage
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Spell Glyph", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateDuration: true,
          generateRange: true,
        },
      },
    ];
  }

}
