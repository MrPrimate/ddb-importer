import DDBEnricherData from "../../data/DDBEnricherData";

export default class ConjureWoodlandSpirit extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "enemy",
      activationType: "action",
      activationCondition: "An enemy moves into or leaves a space adjacent to the guardian spirit",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        description: {
          chatFlavor: "Conjures a Large spectral guardian cat in an unoccupied space within 60 ft; lasts while you concentrate, up to 10 minutes.",
        },
        range: {
          value: 60,
          units: "ft",
        },
        duration: {
          units: "minute",
          value: "10",
        },
        save: {
          ability: ["wis"],
          dc: {
            calculation: "wis",
            formula: "",
          },
        },
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.road.travelers-tricks",
              types: ["slashing"],
            }),
          ],
        },
      },
    };
  }

}
