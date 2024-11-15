/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DustOfSneezingAndChoking extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Sneezing and Choking",
        options: {
          transfer: false,
          description: "You are &Reference[incapacitated]{incapacitated} and &Reference[suffocating]{suffocating}.",
        },
        statuses: ["Incapacitated", "Suffocating"], // ?
      },
    ];
  }

}
