import DDBEnricherData from "../../data/DDBEnricherData";

export default class Helmsplitter4Points extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      activationCondition: "You hit a creature with an attack",
      // the default parse wires the maneuvers-known scale in as damage; the maneuver only stuns
      removeDamageParts: true,
    };
  }

}
