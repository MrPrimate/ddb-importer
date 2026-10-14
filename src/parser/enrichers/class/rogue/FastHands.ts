import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Each Bonus Action option is its own activity: the Sleight of Hand and thieves' tools options are
 * checks, the others utilities. 2024 folds the thieves' tools use into the Sleight of Hand check.
 */
export default class FastHands extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  #check(name: string, associated: string[]): IDDBAdditionalActivity {
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
      build: {
        generateActivation: true,
        activationOverride: { type: "bonus", value: null, condition: "" },
        generateConsumption: false,
        generateCheck: true,
        checkOverride: {
          associated,
          ability: "dex",
          dc: { calculation: "", formula: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return [
        this.#check("Sleight of Hand", ["slt"]),
        this.#check("Thieves' Tools", ["thief"]),
        {
          init: { name: "Use an Object", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
          build: {
            generateActivation: true,
            activationOverride: { type: "bonus", value: null, condition: "" },
            generateConsumption: false,
          },
        },
      ];
    }
    return [
      this.#check("Sleight of Hand", ["slt", "thief"]),
      { action: { name: "Fast Hands: Utilize", type: "class", rename: ["Utilize"] } },
      { action: { name: "Fast Hands: Use Magic Item", type: "class", rename: ["Use Magic Item"] } },
    ];
  }

}
