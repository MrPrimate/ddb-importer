// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

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
