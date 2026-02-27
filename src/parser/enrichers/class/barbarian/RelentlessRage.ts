import DDBEnricherData from "../../data/DDBEnricherData";

export default class RelentlessRage extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      activationType: "special",
      targetType: "self",
      addItemConsume: true,
      data: {
        save: {
          ability: ["con"],
          dc: {
            calculation: "",
            formula: "10 + (@item.uses.spent * 5)",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Apply Healing",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          targetSelf: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: this.is2014 ? "1" : "@classes.barbarian.levels * 2",
            type: "healing",
          }),
        },
      },
    ];
  }

  get override() {
    return {
      retainResourceConsumption: true,
      retainUseSpent: true,
      uses: {
        spent: 0,
        max: "30",
        recovery: [
          {
            period: this.is2014 ? "sr" : "lr",
            type: "recoverAll",
          },
        ],
      },
    };
  }
}
