import DDBEnricherData from "../../data/DDBEnricherData";

export default class Maneuver extends DDBEnricherData {
  // get addAutoAdditionalActivities() {
  //   return true;
  // }

  extraDamageActivity(): IDDBAdditionalActivity {
    return {
      init: {
        name: "Damage",
        type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        generateDamage: true,
        generateTarget: true,
        generateRange: true,
        generateConsumption: false,
        generateActivation: true,
        activationOverride: {
          type: "special",
          value: 1,
          condition: "",
        },
      },
      overrides: {
        targetType: "creature",
        activationType: "special",
        data: {
          damage: {
            onSave: "none",
            parts: [
              DDBEnricherData.basicDamagePart({
                customFormula: this.diceString,
                types: DDBEnricherData.allDamageTypes(),
              }),
            ],
          },
        },
      },
    };
  }

  get diceString() {
    if (this.isClass("Fighter")) {
      if (this.hasClassFeature({ featureName: "Combat Superiority", className: "Fighter" })) {
        return "@scale.battle-master.combat-superiority-die";
      }
    }
    // maneuvers from feat
    return "1d6";
  }

  get ignoredConsumptionActivities() {
    return ["Damage"];
  }

  override get override(): IDDBOverrideData {
    const name = this.data.name
      .replace("Maneuver Options:", "Maneuver:")
      .replace("Maneuvers:", "Maneuver:")
      .replace("Martial Adept: ", "Maneuver: ");
    return {
      ignoredConsumptionActivities: this.ignoredConsumptionActivities,
      data: {
        name,
        system: {
          type: {
            "value": "class",
            "subtype": "maneuver",
          },
          uses: {
            spent: null,
            max: "",
            recovery: [],
          },
        },
      },
    };
  }

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      addItemConsume: true,
      activationType: "special",
      data: {
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: this.diceString,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

}
