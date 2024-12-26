/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ComprehendLanguages extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Comprehend Languages",
        changes: [
          // this effect is provided by DDBI or DAE
          DDBEnricherData.ChangeHelper.customChange("1", 20, "system.traits.languages.all"),
        ],
      },
    ];
  }

}
