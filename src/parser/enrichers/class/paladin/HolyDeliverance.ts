import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oath of the Holy (World of Warcraft) level 20: a 1/LR Bonus Action imbuing the Aura of Protection
 * for 10 minutes, healing Bloodied allies that start their turn in it for Cha mod + PB. A level 5
 * spell slot restores the use.
 */
export default class HolyDeliverance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate",
      activationType: "bonus",
      addItemConsume: true,
      targetType: "self",
      data: {
        duration: {
          units: "minute",
          value: "10",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Healing Power",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: {
            type: "turnStart",
            value: 1,
            condition: "An ally starts its turn Bloodied in your Aura of Protection",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "ally",
            },
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@abilities.cha.mod + @prof",
            types: ["healing"],
          }),
        },
      },
      {
        init: {
          name: "Spend Spell Slot to Restore Use",
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
                value: "-1",
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "5",
                scaling: { mode: "", formula: "" },
              },
            ],
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Holy Deliverance",
        activityMatch: "Activate",
        options: {
          durationSeconds: 600,
          description: "Your Aura of Protection is filled with Bright Light that is sunlight. Bloodied allies starting their turn in it regain Hit Points equal to your Charisma modifier plus your Proficiency Bonus.",
        },
      },
    ];
  }

}
