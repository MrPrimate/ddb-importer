/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ConcussionGrenade extends DDBEnricherData {

  get activity() {
    return {
      data: {
        range: {
          value: "60",
          unit: "ft",
        },
      },
    };
  }

}
