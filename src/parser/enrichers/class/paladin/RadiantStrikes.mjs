/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RadiantStrikes extends DDBEnricherData {

  get activity() {
    return {
      type: "none",
    };
  }

  get effects() {
    return [{
      options: {
        transfer: true,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("1d8[radiant]", 20, "system.bonuses.mwak.damage"),
      ],
    }];
  }

}
