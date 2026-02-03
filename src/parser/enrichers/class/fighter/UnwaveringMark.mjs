/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UnwaveringMark extends DDBEnricherData {

  get activity() {
    return {
      name: "Mark Target",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
          },
        },
        overrides: {
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@classes.fighter.levels / 2",
                  types: DDBEnricherData.allDamageTypes(),
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Unwavering Mark",
        options: {
          durationSeconds: 6,
          description: `Disadvantage on attack rolls against targets other than you until the start of your next turn`,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("!workflow.target.getName('@token.name')", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

  get override() {
    return {
      data: {
        system: {
          uses: {
            max: "max(1, @abilities.str.mod)",
          },
        },
      },
    };
  }

}
