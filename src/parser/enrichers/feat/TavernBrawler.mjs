/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class TavernBrawler extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.generateOverrideChange("true", 20, "flags.dnd5e.tavernBrawlerFeat"),
        ],
      },
    ];
  }

  get additionalActivities() {
    return [
      { action: { name: "Enhanced Unarmed Strike", type: "feat", rename: ["Enhanced Unarmed Strike"] } },
    ];
  }

}
