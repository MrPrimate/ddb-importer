/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ComprehendLanguages extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Comprehend Languages",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("ALL", 20, "system.traits.languages.value"),
        ],
      },
    ];
  }

}
