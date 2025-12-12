/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MoveAndAttack extends DDBEnricherData {
  get type() {
    return "attack";
  }

  get activity() {
    return {
      activationType: "bonus",
      data: {
        attack: {
          critical: {
            threshold: 18,
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 10,
              denomination: 6,
              types: ["force"],
            }),
          ],
        },
      },
    };
  }
}
