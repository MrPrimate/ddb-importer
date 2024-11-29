/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WrathOfTheStorm extends DDBEnricherData {
  get activity() {
    return {
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              types: ["thunder", "lightning"],
            }),
          ],
        },
      },
    };
  }
}
