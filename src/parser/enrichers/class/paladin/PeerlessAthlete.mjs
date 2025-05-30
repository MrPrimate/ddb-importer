/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PeerlessAthlete extends DDBEnricherData {

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

  get effects() {
    return [{
      name: "Peerless Athlete",
      options: {
        durationSeconds: 3600,
        description: "Advantage on Strength (Athletics) and Dexterity (Acrobatics) checks, and the distance of your Long and High Jumps increases by 10 feet",
      },
    }];
  }

}
