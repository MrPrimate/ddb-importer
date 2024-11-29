/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ManeuverAmbush extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.attributes.init.bonus"),
        ],
      },
    ];
  }

}
