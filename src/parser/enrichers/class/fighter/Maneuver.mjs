/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Maneuver extends DDBEnricherData {
  // get addAutoAdditionalActivities() {
  //   return true;
  // }

  extraDamageActivity() {
    return {
      constructor: {
        name: "Damage",
        type: "damage",
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

  get fighterAbility() {
    const characterAbilities = this.ddbParser.ddbCharacter.abilities.withEffects;
    const ability = characterAbilities.str?.value > characterAbilities.dex?.value ? "str" : "dex";
    return ability;
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

  get override() {
    return {
      data: {
        name: this.data.name.replace("Maneuver Options:", "Maneuver:").replace("Maneuvers:", "Maneuver: "),
        "flags.ddbimporter": {
          ignoredConsumptionActivities: this.ignoredConsumptionActivities,
        },
      },
    };
  }

}
