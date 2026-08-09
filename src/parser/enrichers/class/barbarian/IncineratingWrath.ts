import DDBEnricherData from "../../data/DDBEnricherData";

export default class IncineratingWrath extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "You take damage from a creature you can see within 60 feet while raging",
      addItemConsume: true,
      data: {
        range: {
          units: "ft",
          value: "60",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({ number: 3, denomination: 10, type: "fire" }),
          ],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "2",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
