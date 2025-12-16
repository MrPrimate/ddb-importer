/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Wardaway extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Disoriented",
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
        ],
        options: {
          description: "Target's Speed is halved until the start of your next turn, and on its next turn, it can take only an Action or a Bonus Action.",
        },
        daeSpecialDurations: ["turnStartSource"],
      },
    ];
  }

}
