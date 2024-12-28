/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Polymorph extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          durationSeconds: 3600,
        },
        name: "Polymorphed",
      },
    ];
  }

  get override() {
    return {
      data: {
        flags: {
          midiProperties: {
            autoFailFriendly: true,
          },
        },
      },
    };
  }
}
