/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ImprovedCircleForms extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        changes: [
          DDBEnricherData.ChangeHelper.addChange("@abilities.wis.mod", 20, "system.abilities.con.bonuses.save"),
        ],
      },
    ];
  }

}
