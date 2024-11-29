/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DivineOrderThaumaturge extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.scale.cleric.cantrips-known.value"),
        ],
      },
    ];
  }

}
