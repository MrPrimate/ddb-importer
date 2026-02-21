import DDBEnricherData from "../data/DDBEnricherData";

export default class ChromaticOrb extends DDBEnricherData {
  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 8,
              types: ["acid", "cold", "fire", "lightning", "poison", "thunder"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }
}
