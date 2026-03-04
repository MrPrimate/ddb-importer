import DDBEnricherData from "../data/DDBEnricherData";

export default class EpicBoon extends DDBEnricherData {

  get override(): IDDBOverrideData {
    return {
      data: {
        "name": "Epic Boon",
      },
    };
  }

}
