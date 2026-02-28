import DDBEnricherData from "../../data/DDBEnricherData";

export default class ScornfulRebuke extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      targetType: "creature",
      activationOverride: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@abilities.cha.mod",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }
}
