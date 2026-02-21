import DDBEnricherData from "../data/DDBEnricherData";

export default class Catapult extends DDBEnricherData {

  get activity() {
    return {
      data: {
        damage: {
          onSave: "none",
        },
      },
    };
  }

}
