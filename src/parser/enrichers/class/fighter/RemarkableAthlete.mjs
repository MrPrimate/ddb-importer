/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RemarkableAthlete extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: !this.is2014,
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.remarkableAthlete"),
        ],
      },
    ];
  }

}
