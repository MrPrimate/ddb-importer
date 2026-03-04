import DDBEnricherData from "../data/DDBEnricherData";

export default class DustOfSneezingAndChoking extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
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
