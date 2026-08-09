import DDBEnricherData from "../../data/DDBEnricherData";

export default class LiarsDice extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      data: {
        name: "Liar's Dice",
      },
    };
  }

}
