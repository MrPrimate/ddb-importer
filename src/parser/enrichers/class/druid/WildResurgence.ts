import DDBEnricherData from "../../data/DDBEnricherData";

export default class WildResurgence extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Spend Spell Slot for Wild Shape Use",
      addItemConsume: true,
      itemConsumeValue: "-1",
      activationType: "special",
      activationCondition: "Once on each of your turns",
      data: {
        img: "systems/dnd5e/icons/svg/abilities/intelligence.svg",
      },
      additionalConsumptionTargets: [
        {
          type: "spellSlots",
          value: "1",
          target: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Wild Resurgence: Regain Spell Slot",
      max: "1",
      period: "lr",
      override: true,
    });
    return [
      {
        init: {
          name: "Spend Wild Shape to Regain Spell Slot",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          img: "systems/dnd5e/icons/svg/trait.svg",
          generateConsumption: true,
          generateTarget: true,
          generateUses: true,
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "activityUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "-1",
                target: "1",
                scaling: {},
              },
            ],
            scaling: { allowed: true, max: "9" },
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "self",
            },
          },
          usesOverride: uses,
        },
      },
    ];
  }

}
