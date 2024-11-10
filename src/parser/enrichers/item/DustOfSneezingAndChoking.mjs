/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class DustOfSneezingAndChoking extends DDBEnricherMixin {

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
