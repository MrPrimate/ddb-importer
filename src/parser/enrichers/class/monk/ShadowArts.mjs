/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ShadowArts extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.darkvision"),
        ],
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }
}
