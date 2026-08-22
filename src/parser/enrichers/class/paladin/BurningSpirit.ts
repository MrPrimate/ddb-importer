import DDBEnricherData from "../../data/DDBEnricherData";

export default class BurningSpirit extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Burning Spirit",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        range: {
          units: "self",
        },
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Vengeful Flame",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "At the end of each of your turns",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "max(2, 2 * @abilities.cha.mod)",
              types: ["fire"],
            }),
          ],
        },
      },
      {
        init: {
          name: "Restore Burning Spirit",
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
                type: "spellSlots",
                value: "1",
                target: "5",
                scaling: { allowed: false, max: "" },
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
        name: "Burning Spirit",
        activityMatch: "Activate Burning Spirit",
        options: {
          durationSeconds: 600,
          description: "You shed Bright Light in your Aura of Protection and Dim Light for an additional 30 feet, your Speed increases by 10 feet, and you can move through other creatures' spaces.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("10", 20),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", "upgrade", "@scale.paladin.aura-of-protection", 20),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", "upgrade", "@scale.paladin.aura-of-protection + 30", 20),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "class", name: "Burning Spirit", max: "1", period: "lr" }),
    };
  }

}
