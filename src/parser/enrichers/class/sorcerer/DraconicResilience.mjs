/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DraconicResilience extends DDBEnricherData {

  get effects() {
    const acType = this.is2014 ? "draconic" : "unarmoredBard";
    return [
      {
        noCreate: true,
        changesOverwrite: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1 * @classes.sorcerer.levels", 20, "system.attributes.hp.bonuses.overall"),
          DDBEnricherData.ChangeHelper.overrideChange(acType, 20, "system.attributes.ac.calc"),
        ],
      },
    ];
  }

}
