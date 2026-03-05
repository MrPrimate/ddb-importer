import DDBEnricherData from "../../data/DDBEnricherData";

export default class PrimalCompanion extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Command",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      activationType: "bonus",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return this.is2014
      ? [
        {
          init: {
            name: "Summon",
            type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
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
          init: {
            name: "Summon With Spell Slot",
            type: DDBEnricherData.ACTIVITY_TYPES.FORWARD,
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
