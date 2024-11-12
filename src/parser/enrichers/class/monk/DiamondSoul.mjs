/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class DiamondSoul extends DDBEnricherMixin {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherMixin.generateOverrideChange("true", 20, "flags.dnd5e.diamondSoul"),
        ],
      },
    ];
  }

}
