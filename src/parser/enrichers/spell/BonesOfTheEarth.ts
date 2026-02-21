import DDBEnricherData from "../data/DDBEnricherData";

export default class BonesOfTheEarth extends DDBEnricherData {

  get override() {
    return {
      data: {
        "system.target.template": {
          count: "6",
          size: "2.5",
        },
      },
    };
  }

}
