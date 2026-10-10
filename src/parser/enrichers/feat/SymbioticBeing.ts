import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dark Gift: Sustained Symbiosis spends a Hit Die and one of its proficiency-bonus uses per long
 * rest, and adds the die rolled to the failed save. As in the official feat, one activity spends the
 * largest Hit Die and one the smallest, each rolling the die it spent (`@consumed.hd`).
 */
export default class SymbioticBeing extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  static sustainedSymbiosis(size: "Largest" | "Smallest"): IDDBAdditionalActivity {
    return {
      action: { name: "Symbiotic Being: Sustained Symbiosis", type: "feat" },
      overrides: {
        // the largest keeps the id the single activity had; both come from the same DDB action
        ...(size === "Smallest" ? { id: "ddbSymbSustSmal1" } : {}),
        data: {
          name: `Symbiotic Being: Sustained Symbiosis (${size} Hit Die)`,
          roll: { name: "Hit Die", formula: "@consumed.hd", prompt: false, visible: true },
          consumption: {
            targets: [
              { type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } },
              { type: "hitDice", target: size.toLowerCase(), value: "1", scaling: { mode: "", formula: "" } },
            ],
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      SymbioticBeing.sustainedSymbiosis("Largest"),
      SymbioticBeing.sustainedSymbiosis("Smallest"),
      { action: { name: "Symbiotic Being: Symbiotic Agenda", type: "feat" } },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Symbiotic Being: Sustained Symbiosis",
        max: "@prof",
        period: "lr",
      }),
    };
  }

}
