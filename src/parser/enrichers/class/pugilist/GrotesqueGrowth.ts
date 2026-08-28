import DDBEnricherData from "../../data/DDBEnricherData";

export default class GrotesqueGrowth extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Grotesque Growth",
      useActivitySnippet: true,
      targetType: "self",
      addItemConsume: true,
      activationType: "special",
      activationCondition: "When you use your Dread Hand feature",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Restore Grotesque Growth",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          chatFlavor: "You must take a level of Exhaustion (no action required by you) to restore your use of Grotesque Growth.",
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
            ],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Grotesque Growth",
        options: {
          durationSeconds: 60,
          description: "Your size increases by one category, doubling your carrying capacity, and you have a 10-foot reach.",
        },
        activitiesMatch: ["Grotesque Growth"],
        changes: [
          DDBEnricherData.ChangeHelper.addChange("1", 20, "system.traits.size"),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("str"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.rolls.damage.rwak.bonus"),
        ],
        // set rather than +5: the feature states the reach outright, and only AC5e's
        // melee out-of-range check consumes it
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("reach=10", 20, "flags.automated-conditions-5e.range"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Grotesque Growth",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
