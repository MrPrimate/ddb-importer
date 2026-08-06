import DDBEnricherData from "../../data/DDBEnricherData";

export default class CommandingGrasp2Points extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      activationCondition: "Choose a creature of your size or smaller within 30 feet that you can see",
      // the default parse wires the maneuvers-known scale in as damage; the maneuver deals none
      removeDamageParts: true,
    };
  }

}
