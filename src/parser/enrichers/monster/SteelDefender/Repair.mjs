/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Repair extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "creature",
      noTemplate: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 8,
          types: ["healing"],
        }),
      },
    };
  }

}
