import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Warrior of the Street Special Move: the blast replaces one attack of the Attack action, so it
 * takes no action of its own. The parsed save, damage scale and Focus cost are kept.
 */
export default class SpecialMoveEnergyBlast extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Energy Blast",
      activationType: "special",
      activationCondition: "Replace one attack when you take the Attack action on your turn",
      data: {
        damage: {
          onSave: "half",
        },
      },
    };
  }

}
