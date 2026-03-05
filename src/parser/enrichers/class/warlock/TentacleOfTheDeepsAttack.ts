import DDBEnricherData from "../../data/DDBEnricherData";

export default class TentacleOfTheDeepsAttack extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
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
