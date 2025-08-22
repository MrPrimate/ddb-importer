/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PrimalCompanion extends DDBEnricherData {

  get activity() {
    return {
      name: "Command",
      type: "utility",
      activationType: "bonus",
    };
  }

  get additionalActivities() {
    return this.is2014
      ? [
        {
          constructor: {
            name: "Summon",
            type: "summon",
          },
          build: {
            generateRange: true,
            generateSummon: true,
            generateConsumption: true,
          },
          overrides: {
            id: "summonPriCSclNe1",
            summons: {
              "bonuses": {
                "attackDamage": "@prof",
              },
              match: {
                proficiency: true,
                attacks: true,
                saves: true,
              },
            },
          },
        },
        {
          constructor: {
            name: "Summon With Spell Slot",
            type: "forward",
          },
          build: {
          },
          overrides: {
            activationType: "action",
            activationCondition: "Takes 1 minute to be restored to life",
            data: {
              activity: {
                id: "summonPriCSclNe1",
              },
              consumption: {
                targets: [
                  {
                    type: "spellSlots",
                    value: "1",
                    target: "1",
                    scaling: {},
                  },
                ],
                scaling: {
                  allowed: true,
                  max: "",
                },
                spellSlot: true,
              },
              uses: { spent: null, max: "" },
              midiProperties: {
                confirmTargets: "default",
              },
            },
          },
        },
      ]
      : [
        {
          action: {
            name: "Primal Companion: Summon",
            type: "class",
          },
          overrides: {
            id: "summonPriCSclNe1",
          },
        },
        {
          action: {
            name: "Primal Companion: Restore Beast",
            type: "class",
          },
        },
      ];
  }

  get parseAllChoiceFeatures() {
    return true;
  }

}
