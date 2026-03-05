import DDBEnricherData from "../../data/DDBEnricherData";

export default class GloriousDefense extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@abilities.cha.mod",
          name: "Bonus to attack",
        },
      },
    };
  }

}
