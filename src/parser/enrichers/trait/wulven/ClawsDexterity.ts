import DDBEnricherData from "../../data/DDBEnricherData";

export default class ClawsDexterity extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        attack: {
          ability: "dex",
        },
      },
    };
  }

}
