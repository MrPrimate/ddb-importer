/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class VowOfEnmity extends DDBEnricherData {

  get activity() {
    return {
      name: "Activate Vow",
      type: "utility",
      addItemConsume: true,
      activationType: "special",
      activationCondition: "Take the attack action",
      targetType: "creature",
      data: {
        range: {
          units: "ft",
          value: 30,
        },
      },
    };
  }

  get effects() {
    return [{
      name: "Vow of Enmity",
      options: {
        description: "You gain advantage on attack rolls against the creature",
        durationSeconds: 60,
      },
      midiChanges: [],
    }];
  }


}
