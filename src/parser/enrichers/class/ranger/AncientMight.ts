import DDBEnricherData from "../../data/DDBEnricherData";

export default class AncientMight extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@abilities.wis.mod",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return[
      {
        init: {
          name: "Persistent Wrath",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateRange: false,
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          id: "ddbPersistentWra",
          activationType: "special",
          targetType: "self",
          noConsumeTargets: true,
          activationCondition: "Reduced to 0 HP but not killed outright and transformed",
          addActivityConsume: true,
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "@classes.ranger.levels",
              types: ["healing"],
            }),
            uses: {
              spent: null,
              max: "1",
              recovery: [
                { period: "lr", type: "recoverAll", formula: undefined },
              ],
            },
          },
        },
      },
      {
        init: {
          name: "Spend Spell Slot to Restore Persistent Wrath",
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
                type: "activityUses",
                target: "ddbPersistentWra",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "4",
                scaling: { allowed: false, max: "6" },
              },
            ],
          },
        },
      },
    ];
  }

}
