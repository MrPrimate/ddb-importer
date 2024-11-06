/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class Luck extends DDBEnricherMixin {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherMixin.generateOverrideChange("true", 20, "flags.dnd5e.halflingLucky"),
        ],
      },
    ];
  }

}
