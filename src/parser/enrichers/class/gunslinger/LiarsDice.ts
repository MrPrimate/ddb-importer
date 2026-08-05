import DDBEnricherData from "../../data/DDBEnricherData";

export default class LiarsDice extends DDBEnricherData {

  get override(): IDDBOverrideData {
    return {
      data: {
        name: "Liar's Dice",
      },
    };
  }

}
