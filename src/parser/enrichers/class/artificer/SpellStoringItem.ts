import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpellStoringItem extends DDBEnricherData {

  override get type() {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      { action: { name: "Spell-Storing Item: Store Spell", type: "class", rename: ["Store Spell"] } },
    ];
  }

  override get override(): IDDBOverrideData | null {
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
