/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class BeguilingTwist extends DDBEnricherMixin {

  get effect() {
    return {
      multiple: [
        {
          name: "Charmed",
          options: {
            durationSeconds: 60,
          },
          statuses: ["Charmed"],
        },
        {
          name: "Frightened",
          options: {
            durationSeconds: 60,
          },
          statuses: ["Frightened"],
        },
      ],
    };
  }

}
