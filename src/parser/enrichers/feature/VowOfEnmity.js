/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class VowOfEnmity extends DDBEnricherMixin {

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

  get effect() {
    return {
      name: "Vow of Enmity",
      options: {
        description: "You gain advantage on attack rolls against the creature",
        durationSeconds: 60,
      },
      midiChanges: [],
    };
  }


}
