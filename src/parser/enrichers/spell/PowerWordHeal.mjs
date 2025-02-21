/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class PowerWordHeal extends DDBEnricherData {
  get activity() {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "10000",
          types: ["healing"],
        }),
      },
    };
  }
}
