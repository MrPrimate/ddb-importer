import DDBEnricherData from "../../data/DDBEnricherData";

export default class ClairvoyantCombatant extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Awakened Mind: Clairvoyant Combatant", type: "class" } },
      {
        init: {
          name: "Spend Pact Slot to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "attribute",
                value: "1",
                target: "spells.pact.value",
              },
            ],
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({ type: "class", name: "Awakened Mind: Clairvoyant Combatant", max: "1", period: "sr" });
    return {
      uses,
    };
  }

}
