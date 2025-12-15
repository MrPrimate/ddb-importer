/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Doomtide extends DDBEnricherData {

  get activity() {
    return {
      name: "Cast",
    };
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        id: "ddbDoomTideAdSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            range: {
              override: true,
              units: "spec",
            },
            target: {
              override: true,
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Doomed",
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("-1d6", 20, "system.bonuses.abilities.save"),
        ],
        daeSpecialDurations: ["turnEnd"],
      },
    ];
  }

}
