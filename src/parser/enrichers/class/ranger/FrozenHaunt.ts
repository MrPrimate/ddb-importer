import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Activating is a self-enchantment whose riders are the partially incorporeal effect and the
 * Frozen Soul damage, so the damage only appears while Frozen Haunt lasts.
 */
export default class FrozenHaunt extends DDBEnricherData {

  static DAMAGE_ID = "ddbFrozenHauntDm";

  static EFFECT_ID = "ddbFrozenHauntEf";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Frozen Haunt",
      targetType: "self",
      activationType: "special",
      activationCondition: "You cast Hunter's Mark",
      noTemplate: true,
      data: {
        duration: { value: "10", units: "minute" },
        enchant: {
          self: true,
        },
      },
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
          id: FrozenHaunt.DAMAGE_ID,
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
      statuses: ["Transformed"],
      options: {
        transfer: true,
        durationSeconds: 600,
      },
      data: {
        _id: FrozenHaunt.EFFECT_ID,
      },
      changes: [
        DDBEnricherData.ChangeHelper.damageImmunityChange("cold"),
        DDBEnricherData.ChangeHelper.conditionImmunityChange("grappled"),
        DDBEnricherData.ChangeHelper.conditionImmunityChange("prone"),
        DDBEnricherData.ChangeHelper.conditionImmunityChange("restrained"),
      ],
    }, {
      name: "Frozen Haunt",
      type: "enchant",
      activityMatch: "Activate Frozen Haunt",
      changes: toggleOffChanges("End Frozen Haunt"),
      data: {
        flags: {
          ddbimporter: riders({ activities: [FrozenHaunt.DAMAGE_ID], effects: [FrozenHaunt.EFFECT_ID] }),
        },
      },
    }];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  // DDB ships no action (and so no limited use) for this feature; the activities consume item uses, which need a max
  override get override(): IDDBOverrideData {
    return {
      uses: { spent: null, max: "1", recovery: [{ period: "lr", type: "recoverAll", formula: undefined }] },
    };
  }

}
