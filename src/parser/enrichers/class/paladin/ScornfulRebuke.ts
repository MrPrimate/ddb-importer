import DDBEnricherData from "../../data/DDBEnricherData";

export default class ScornfulRebuke extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
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
