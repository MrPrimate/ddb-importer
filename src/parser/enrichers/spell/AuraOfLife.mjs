/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class AuraOfLife extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("necrotic", 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
