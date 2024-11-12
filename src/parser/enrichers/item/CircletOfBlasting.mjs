/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class CircletOfBlasting extends DDBEnricherMixin {

  customFunction({ name, activity }) {
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
