/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FalseLife extends DDBEnricherData {
  get activity() {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: this.is2014 ? 1 : 2,
          denomination: 4,
          bonus: "4",
          types: ["temphp"],
          scalingMode: "whole",
          scalingNumber: "5",
        }),
      },
    };
  }
}
