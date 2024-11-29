/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UnarmoredDefense extends DDBEnricherData {

  get effects() {
    const changes = [];
    if (this.isClass("Barbarian")) {
      changes.push(
        DDBEnricherData.ChangeHelper.overrideChange("unarmoredBarb", 15, "system.attributes.ac.calc"),
      );
    } else if (this.isClass("Monk")) {
      changes.push(
        DDBEnricherData.ChangeHelper.overrideChange("unarmoredMonk", 15, "system.attributes.ac.calc"),
      );
    }
    return [
      {
        noCreate: true,
        changesOverwrite: true,
        changes,
      },
    ];
  }

}
