/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ElvenAccuracy extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.generateOverrideChange("true", 20, "flags.dnd5e.elvenAccuracy"),
        ],
      },
    ];
  }

}
