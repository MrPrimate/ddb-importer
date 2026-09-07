import DDBEnricherData from "../../data/DDBEnricherData";

export default class SymbioticBiosphere extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Symbiotic Biosphere: Release Pheromones",
      activationType: "bonus",
      addItemConsume: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: "@scale.hive.symbiotic-biosphere",
          types: ["poison"],
        }),
      ],
      data: {
        range: { value: "15", units: "ft", special: "" },
        duration: { value: "", units: "spec", special: "until the start of your next turn" },
        save: {
          ability: ["con"],
          dc: { calculation: "wis", formula: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Symbiotic Biosphere: Retaliate",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateDamage: true,
          generateSave: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "When you are targeted by a melee attack from a creature within 15 feet on its turn",
          },
          rangeOverride: {
            value: "15",
            units: "ft",
            special: "",
          },
          durationOverride: {
            value: "",
            units: "spec",
            special: "until the start of your next turn",
          },
          saveOverride: {
            ability: ["con"],
            dc: { calculation: "wis", formula: "" },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.hive.symbiotic-biosphere",
              types: ["poison"],
            }),
          ],
        },
        overrides: {
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Symbiotic Biosphere",
        includesName: true,
        max: "@abilities.wis.mod",
        period: "lr",
      }),
    };
  }

}
