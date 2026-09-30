import DDBEnricherData from "../data/DDBEnricherData";

/** Dark Gift: Sustained Symbiosis spends a Hit Die and one of its proficiency-bonus uses per long rest. */
export default class SymbioticBeing extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Symbiotic Being: Sustained Symbiosis", type: "feat" },
        overrides: {
          data: {
            consumption: {
              targets: [
                { type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } },
                { type: "hitDice", target: "largest", value: "1", scaling: { mode: "", formula: "" } },
              ],
            },
          },
        },
      },
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
