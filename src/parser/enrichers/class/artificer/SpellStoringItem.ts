import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpellStoringItem extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  /** 2014: the item holder produces the stored spell, spending one of the item's uses (twice the Intelligence modifier). */
  override get activity(): IDDBActivityData | null {
    if (!this.is2014) return null;
    return {
      name: "Produce Stored Spell",
      activationType: "action",
      addItemConsume: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      // "Whenever you finish a Long Rest, you can touch ... and store a spell in it"
      {
        action: { name: "Spell-Storing Item: Store Spell", type: "class", rename: ["Store Spell"] },
        overrides: { activationType: "longRest" },
      },
    ];
  }

  get override(): IDDBOverrideData {
    if (this.is2014) return null;
    return {
      uses: {
        max: "",
        spent: null,
        recovery: [],
      },
    };
  }


}
