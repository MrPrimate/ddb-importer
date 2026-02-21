// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class BeastsStrike extends DDBEnricherData {

  get activity() {
    return {
      data: {
        damage: {
          includeBase: true,
          parts: [],
        },
      },
    };
  }

  get override() {
    return {
      data: {
        "system.damage.base": {
          types: ["bludgeoning", "piercing"],
          bonus: "",
        },
      },
    };
  }

}
