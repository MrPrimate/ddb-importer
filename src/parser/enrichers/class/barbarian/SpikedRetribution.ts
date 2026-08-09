import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpikedRetribution extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      activationType: "bonus",
      rangeSelf: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "3",
              types: ["piercing"],
            }),
          ],
        },
        range: {
          value: 5,
          units: "ft",
        },
        target: {
          affects: {
            type: "enemy",
          },
        },
      },
    };
  }

}
