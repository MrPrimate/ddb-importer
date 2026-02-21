import DDBEnricherData from "../data/DDBEnricherData";

export default class EpicBoon extends DDBEnricherData {

  get override() {
    return {
      data: {
        "name": "Epic Boon",
      },
    };
  }

}
