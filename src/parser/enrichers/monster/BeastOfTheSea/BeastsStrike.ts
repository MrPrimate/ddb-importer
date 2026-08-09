// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class BeastsStrike extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          includeBase: true,
          parts: [],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
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
