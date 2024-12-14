/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PactMagic extends DDBEnricherData {

  get effects() {
    if (!this.isSubclass("Order of the Profane Soul")) return [];
    return [
      {
        name: "Pact Magic Level",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("@scale.profane-soul.pact-level", 20, "system.spells.pact.level"),
        ],
      },
    ];
  }

}
