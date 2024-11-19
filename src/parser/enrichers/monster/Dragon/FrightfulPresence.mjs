/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FrightfulPresence extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        data: {
          duration: {
            rounds: 10,
          },
        },
      },
    ];
  }

}
