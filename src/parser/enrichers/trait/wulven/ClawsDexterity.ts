import DDBEnricherData from "../../data/DDBEnricherData";

export default class ClawsDexterity extends DDBEnricherData {
  get type() {
    return "attack";
  }

  get activity() {
    return {
      data: {
        attack: {
          ability: "dex",
        },
      },
    };
  }

}
