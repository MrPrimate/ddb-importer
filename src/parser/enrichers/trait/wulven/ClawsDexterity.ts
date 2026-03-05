import DDBEnricherData from "../../data/DDBEnricherData";

export default class ClawsDexterity extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        attack: {
          ability: "dex",
        },
      },
    };
  }

}
