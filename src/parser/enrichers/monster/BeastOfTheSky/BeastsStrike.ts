// import { utils } from "../../../../lib/_module.mjs";
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
          types: ["slashing"],
          bonus: "",
        },
      },
    };
  }

}
