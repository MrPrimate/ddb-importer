import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

export default class RodOfThePactKeeper extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Regain Pact Slot",
      activationType: "action",
      activationCondition: "While holding the rod, regain one expended Pact Magic slot",
      addItemConsume: true,
      noTemplate: true,
      targetType: "self",
      rangeSelf: true,
      additionalConsumptionTargets: [
        {
          type: "attribute",
          target: "spells.pact.value",
          value: "-min(1,max(0,@spells.pact.max - @spells.pact.value))",
        },
      ],
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "1", [{ period: "lr", type: "recoverAll" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return [];
    }
    // The 2024 source allows a spell slot, without the legacy Warlock-slot restriction.
    return Array.from({ length: 9 }, (_, index) => {
      const level = index + 1;
      return itemActivity(`Regain Level ${level} Slot`, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        addItemConsume: true,
        activationCondition: `Regain one expended level ${level} slot you possess`,
        additionalConsumptionTargets: [
          {
            type: "attribute",
            target: `spells.spell${level}.value`,
            value: `-min(1,max(0,@spells.spell${level}.max - @spells.spell${level}.value))`,
          },
        ],
      });
    });
  }

}
