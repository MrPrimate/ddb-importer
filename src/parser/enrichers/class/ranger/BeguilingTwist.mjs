/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class BeguilingTwist extends DDBEnricherMixin {

  get effects() {
    return [
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
    ];
  }

}
