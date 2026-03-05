import DDBEnricherData from "../data/DDBEnricherData";

export default class Swarm extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              type: "poison",
              scalingMode: "whole",
              scalingFormula: "1d10",
            }),
          ],
        },
      },
    };
  }

}
