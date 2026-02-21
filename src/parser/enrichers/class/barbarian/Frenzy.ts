import DDBEnricherData from "../../data/DDBEnricherData";

export default class Frenzy extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(@scale.barbarian.rage-damage)d6",
            }),
          ],
        },
      },
    };
  }
}
