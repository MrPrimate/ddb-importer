/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EldritchStrike extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Struck",
        options: {
          description: "",
        },
      },
    ];
  }

}
