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
        // DDB flags the action with a Charisma modifier, but the tentacle deals a flat 1d8
        // (2d8 from 10th level) cold damage
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.the-fathomless.tentacle-of-the-deeps",
              types: ["cold"],
            }),
          ],
        },
      },
    };
  }

}
