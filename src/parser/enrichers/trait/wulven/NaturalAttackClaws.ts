import DDBEnricherData from "../../data/DDBEnricherData";
import { utils } from "../../../../lib/_module";

export default class NaturalAttackClaws extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["slashing", "bludgeoning", "piercing"],
            }),
          ],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          properties: utils.addToProperties(this.data.system.properties, "fin"),
        },
      },
    };
  }

}
