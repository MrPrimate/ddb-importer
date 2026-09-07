import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

type TCabalStage = "dormant" | "awakened" | "exalted";

const ABSORB_ACTIVITY = "Absorb Spell";

/**
 * Cabal's Ruin is a Vestige of Divergence: DDB ships one item definition per stage plus an
 * unsuffixed base, and each stage's description repeats every lower stage. Charge counts and
 * recharge resolve per stage in the parser (src/parser/item/Vestige.ts).
 */
export default class CabalsRuin extends DDBEnricherData {

  static ABSORB_DAMAGE_TYPES = [
    "acid", "cold", "fire", "force", "lightning", "necrotic", "poison", "psychic", "radiant", "thunder",
  ];

  get stage(): TCabalStage {
    const match = (/\((Dormant|Awakened|Exalted)\)\s*$/i).exec(this.name);
    // the unsuffixed base item is the cloak as found, i.e. dormant
    return match ? (match[1].toLowerCase() as TCabalStage) : "dormant";
  }

  get isAwakened(): boolean {
    return ["awakened", "exalted"].includes(this.stage);
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Expend Charges for Lightning Damage",
      activationType: "special",
      activationCondition: "When you hit with an attack",
      addItemConsume: true,
      itemConsumeValue: "1",
      addScalingMode: "amount",
      addConsumptionScalingMax: "@item.uses.max - @item.uses.spent",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "lightning",
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: ABSORB_ACTIVITY,
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDamage: false,
          generateRange: false,
          generateTarget: false,
          generateConsumption: false,
          generateUses: true,
          usesOverride: {
            override: true,
            max: "1",
            spent: 0,
            recovery: [{ period: "sr", type: "recoverAll" }],
          },
        },
        overrides: {
          activationType: "reaction",
          activationCondition: "You are targeted by an enemy's spell",
          targetSelf: true,
          noTemplate: true,
          addItemConsume: true,
          itemConsumeValue: "-1",
          addScalingMode: "amount",
          addConsumptionScalingMax: "9",
          addActivityConsume: true,
          activityConsumeValue: "1",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAwakened) return [];
    return CabalsRuin.ABSORB_DAMAGE_TYPES.map((damageType) => {
      return {
        name: `Cabal's Ruin: ${utils.capitalize(damageType)} Resistance`,
        activityMatch: ABSORB_ACTIVITY,
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(damageType, 20),
        ],
        options: {
          // "This resistance then lasts until the end of your next turn" - on the wearer
          expiry: "sourceEnd",
          transfer: false,
        },
      } as IDDBEffectHint;
    });
  }

}
