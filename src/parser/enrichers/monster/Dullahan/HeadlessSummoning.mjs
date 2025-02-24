/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HeadlessSummoning extends DDBEnricherData {

  get type() {
    return "heal";
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
