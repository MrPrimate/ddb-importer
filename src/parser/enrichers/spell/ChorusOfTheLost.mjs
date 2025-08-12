/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ChorusOfTheLost extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Chorus of the Lost: Short Fear",
        statuses: ["Frightened"],
        daeSpecialDurations: ["turnEnd"],
        options: {
          durationSeconds: 6,
        },
      },
    ];
  }

}
