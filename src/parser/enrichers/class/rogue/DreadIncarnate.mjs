/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DreadIncarnate extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.addChange("min3", 20, "system.scale.rogue.sneak-attack.modifiers"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
