import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdamantineBull extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      activationCondition: "A creature of your size or smaller hits you with a melee weapon attack",
      // the default parse wires the stances-known scale in as damage; the stance only pushes
      removeDamageParts: true,
    };
  }

}
