import DDBEnricherData from "../../data/DDBEnricherData";

export default class TentacleOfTheDeepsAttack extends DDBEnricherData {

  get type() {
    return "attack";
  }

  get activity() {
    return {
      data: {
        range: {
          value: 10,
          long: null,
          units: "ft",
        },
        attack: {
          type: {
            value: "melee",
            classification: "spell",
          },
        },
      }
    };
  }

}
