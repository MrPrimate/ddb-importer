/* eslint-disable class-methods-use-this */
import Maneuver from "./Maneuver.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ManeuverDisarmingAttack extends Maneuver {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      activationType: "special",
      addItemConsume: true,
      type: "damage",
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

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Disarmed",
          type: "save",
        },
        build: {
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
          data: {
            damage: {
              onSave: "none",
            },
            save: {
              ability: ["str"],
              dc: {
                calculation: "",
                formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
              },
            },
          },
        },
      },
    ];
  }

  get ignoredConsumptionActivities() {
    return ["Save vs Disarmed"];
  }

}
