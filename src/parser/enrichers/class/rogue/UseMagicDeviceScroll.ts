import DDBEnricherData from "../../data/DDBEnricherData";

export default class UseMagicDeviceScroll extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  /** Scaling is the scroll's spell level, giving the DC of 10 plus that level. */
  get activity(): IDDBActivityData {
    return {
      name: "Scroll",
      activationType: "special",
      activationCondition: "When you use a Spell Scroll of level 2 or higher",
      addConsumptionScalingMax: "9",
      data: {
        check: {
          associated: ["arc"],
          ability: "int",
          dc: {
            calculation: "",
            formula: "10 + @scaling",
          },
        },
      },
    };
  }

}
