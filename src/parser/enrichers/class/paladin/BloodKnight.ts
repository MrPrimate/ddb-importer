import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodKnight extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Activate",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "bonus",
      targetType: "self",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Crimson Armor Temp HP",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateTarget: true,
          generateActivation: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature within your Aura of Protection becomes Bloodied by an enemy",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "self",
            },
          },
          healingPart: DDBEnricherData.basicDamagePart({ bonus: "30", types: ["temphp"] }),
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
      {
        init: {
          name: "Wanton Slaughter Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "You hit a creature with a melee attack roll using a weapon or Unarmed Strike",
          },
          targetOverride: {
            affects: {
              count: "",
              type: "enemy",
              special: "Creatures within 5 feet of the original target and within your reach",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "max(1, @abilities.cha.mod) + @prof",
              types: ["force"],
            }),
          ],
        },
        overrides: {
          noConsumeTargets: true,
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
          noeffect: true,
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

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Blood Knight",
      activitiesMatch: ["Activate"],
      options: {
        durationSeconds: 600,
        description: "Crimson Armor: gain 30 Temporary Hit Points when a creature in your Aura of Protection becomes Bloodied by an enemy. Seeing Red: when a creature hits you with an attack roll, you can take a Reaction to make one melee attack against it. Wanton Slaughter: on a melee hit, deal Force damage equal to your Charisma modifier (minimum +1) plus your Proficiency Bonus to chosen creatures within 5 feet of the target.",
      },
    }];
  }

}
