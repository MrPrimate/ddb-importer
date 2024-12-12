/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ReliableTalent extends DDBEnricherData {

  get type() {
    return "none";
  }

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.reliableTalent"),
        ],
      },
    ];
  }

}
