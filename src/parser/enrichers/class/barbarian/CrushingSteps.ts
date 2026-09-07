import DDBEnricherData from "../../data/DDBEnricherData";

export default class CrushingSteps extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "enemy",
      activationType: "special",
      activationCondition: "You move through the space of a smaller enemy",
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "str",
            formula: "",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Crushed Underfoot",
        statuses: ["Prone"],
        options: {
          description: "Prone and can't take Reactions until the start of its next turn.",
        },
      },
    ];
  }

}
