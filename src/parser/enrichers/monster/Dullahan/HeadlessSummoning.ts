import DDBEnricherData from "../../data/DDBEnricherData";

export default class HeadlessSummoning extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      activationType: "heal",
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
