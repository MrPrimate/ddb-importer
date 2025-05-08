/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ComprehendLanguages extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Comprehend Languages",
        changes: foundry.utils.isNewerVersion(game.system.version, "5.0.1")
          ? [
            DDBEnricherData.ChangeHelper.addChange("ALL", 20, "system.traits.languages.value"),
          ]
          : [
            // this effect is provided by DDBI or DAE
            DDBEnricherData.ChangeHelper.customChange("1", 20, "system.traits.languages.all"),
          ],
      },
    ];
  }

}
