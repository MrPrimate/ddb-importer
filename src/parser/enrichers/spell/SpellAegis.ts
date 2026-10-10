import DDBEnricherData from "../data/DDBEnricherData";

/** The Magus Class: the aegis has 3d8 Hit Points, plus 1d8 per slot level above 1. */
export default class SpellAegis extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "(@item.level + 2)d8",
          name: "Aegis Hit Points",
        },
      },
    };
  }

}
