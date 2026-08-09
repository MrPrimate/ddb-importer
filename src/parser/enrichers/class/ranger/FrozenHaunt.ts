import DDBEnricherData from "../../data/DDBEnricherData";

export default class FrozenHaunt extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Frozen Haunt",
      targetType: "self",
      activationType: "special",
      activationCondition: "You cast Hunter's Mark",
      noTemplate: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Frozen Soul Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          generateDamage: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "When adopted and the start of each turn",
          targetType: "creature",
          rangeSelf: true,
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 4,
                  type: "cold",
                }),
              ],
            },
            target: {
              affects: {
                type: "creature",
                choice: true,
              },
              template: {
                count: "",
                contiguous: false,
                type: "radius",
                size: "15",
                width: "",
                height: "",
                units: "ft",
              },
            },
          },
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
            scaling: { allowed: true, max: "6" },
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
                target: "4",
                scaling: { mode: "level", formula: "" },
              },
            ],
          },
        },
      },
    ];
  }


  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Partially Incorporeal",
      options: {
        durationSeconds: 600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.damageImmunityChange("cold"),
        DDBEnricherData.ChangeHelper.conditionImmunityChange("grappled"),
        DDBEnricherData.ChangeHelper.conditionImmunityChange("prone"),
        DDBEnricherData.ChangeHelper.conditionImmunityChange("restrained"),
      ],
      activityMatch: "Activate Frozen Haunt",
    }];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
