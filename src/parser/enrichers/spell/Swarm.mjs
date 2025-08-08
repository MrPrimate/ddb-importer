/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Swarm extends DDBEnricherData {

  get activity() {
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
