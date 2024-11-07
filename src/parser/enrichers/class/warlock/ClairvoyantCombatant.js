/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class ClairvoyantCombatant extends DDBEnricherMixin {

  get type() {
    return null;
  }

  get additionalActivities() {
    return [
      { action: { name: "Awakened Mind: Clairvoyant Combatant", type: "class" } },
      {
        constructor: {
          name: "Spend Pact Slot to Restore Use",
          type: "utility",
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

  get override() {
    const uses = this._getUsesWithSpent({ type: "class", name: "Awakened Mind: Clairvoyant Combatant", max: "1", period: "sr" });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
