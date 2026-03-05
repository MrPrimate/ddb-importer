import DDBEnricherData from "../data/DDBEnricherData";

export default class Catapult extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          onSave: "none",
        },
      },
    };
  }

}
