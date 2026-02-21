import DDBEnricherData from "../../data/DDBEnricherData";
import { utils } from "../../../../lib/_module";

export default class NaturalAttackClaws extends DDBEnricherData {
  get type() {
    return "attack";
  }

  get activity() {
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

  get override() {
    return {
      data: {
        system: {
          properties: utils.addToProperties(this.data.system.properties, "fin"),
        },
      },
    };
  }

}
