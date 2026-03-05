// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class MoveAndAttack extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
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
