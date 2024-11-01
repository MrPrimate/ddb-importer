/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class PeerlessAthlete extends DDBEnricherMixin {

  get activity() {
    return {
      type: "utility",
      name: "Activate Peerless Athlete",
      addItemConsume: true,
      data: {
        duration: {
          units: "hour",
          vaue: "1",
        },
      },
    };
  }

  get effect() {
    return {
      name: "Peerless Athlete",
      options: {
        transfer: false,
        durationSeconds: 3600,
        description: "Advantage on Strength (Athletics) and Dexterity (Acrobatics) checks, and the distance of your Long and High Jumps increases by 10 feet",
      },
    };
  }

}
