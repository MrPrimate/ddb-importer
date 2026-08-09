import DDBEnricherData from "../../data/DDBEnricherData";

export default class HeadlessSummoning extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      targetType: "self",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              bonus: "97",
              type: "healing",
            }),
          ],
        },
      },
    };
  }


}
