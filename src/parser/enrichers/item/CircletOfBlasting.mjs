/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class CircletOfBlasting extends DDBEnricherData {

  async customFunction({ name, activity } = {}) {
    if (name === "Scorching Ray") {
      activity.data = foundry.utils.mergeObject(activity.data, {
        spell: {
          challenge: {
            attack: "5",
            override: true,
          },
        },
      });
    }
    return activity;
  }

}
