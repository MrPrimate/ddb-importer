import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessedChosen extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You are reduced to 0 hit points",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.monk.levels",
          type: "healing",
        }),
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          activationType: "action",
          targetType: "creature",
          data: {
            name: "Revive the Fallen",
            range: {
              units: "touch",
            },
          },
        },
      },
    ];
  }

}
