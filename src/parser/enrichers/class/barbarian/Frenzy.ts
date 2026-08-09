import DDBEnricherData from "../../data/DDBEnricherData";

export default class Frenzy extends DDBEnricherData {
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
              customFormula: "(@scale.barbarian.rage-damage)d6",
            }),
          ],
        },
      },
    };
  }
}
