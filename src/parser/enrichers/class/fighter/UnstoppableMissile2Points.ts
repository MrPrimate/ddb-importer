import DDBEnricherData from "../../data/DDBEnricherData";

export default class UnstoppableMissile2Points extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      activationCondition: "Throw a melee weapon you are wielding in a 5-foot-wide, 30-foot-long line",
      // damage is one roll of the thrown weapon's dice plus your modifier and cannot be
      // derived from the feature; the default parse wires the maneuvers-known scale in instead
      removeDamageParts: true,
    };
  }

}
