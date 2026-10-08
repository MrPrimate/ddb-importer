import DDBEnricherData from "../data/DDBEnricherData";
import { endSpellChanges, riders, selfEnchantCast } from "./_SelfEnchantSpell";

/**
 * "Cast" applies the cold immunity and fire resistance and places a 10-foot "radius" emanation
 * that follows the caster. The area only carries icy difficult terrain: the spell deals no damage
 * for being near the caster, so no region event fires an activity. The terrain applies to every
 * creature, because native difficult terrain filters by disposition but cannot exempt the caster
 * ("creatures other than you"), which is left to the table. Nothing branches on the printing.
 * Freezing Cone is a separate action whose slow lasts until the start of the caster's next turn.
 *
 * Cast is a self-enchantment that still places the area (see _SelfEnchantSpell): the caster's
 * immunity and resistance are an effect rider and Freezing Cone an activity rider, so the cone
 * only appears while the spell lasts.
 */
export default class InvestitureOfIce extends DDBEnricherData {

  static CAST_ID = "ddbInvestIceCast";

  static CONE_ID = "ddbInvestIceCone";

  static RIDER_EFFECT_ID = "ddbInvestIceRidr";

  static PROFILE_ID = "ddbInvestIceEnch";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return selfEnchantCast({
      id: InvestitureOfIce.CAST_ID,
      keepTemplate: true,
      data: {
        target: {
          override: true,
          template: {
            type: "radius",
            size: "10",
            units: "ft",
          },
          affects: {
            type: "creature",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["ice"] }),
        ],
      },
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Freezing Cone",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateSave: true,
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          noSpellslot: true,
          onSave: "half",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 6,
              type: "cold",
            }),
          ],
          targetOverride: {
            override: true,
            template: {
              type: "cone",
              size: "15",
              units: "ft",
            },
            affects: {
              type: "creature",
            },
          },
          activationOverride: {
            type: "action",
          },
          saveOverride: {
            ability: ["con"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
        },
        overrides: {
          id: InvestitureOfIce.CONE_ID,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Investiture of Ice",
        changes: [
          DDBEnricherData.ChangeHelper.damageImmunityChange("cold"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("fire"),
        ],
        options: {
          transfer: true,
          durationSeconds: 600,
        },
        data: {
          _id: InvestitureOfIce.RIDER_EFFECT_ID,
        },
      },
      {
        name: "Investiture of Ice",
        type: "enchant",
        activityMatch: "Cast",
        options: {
          durationSeconds: 600,
        },
        changes: endSpellChanges(InvestitureOfIce.CAST_ID, "End Investiture of Ice", { clearTemplate: true }),
        data: {
          _id: InvestitureOfIce.PROFILE_ID,
          flags: {
            ddbimporter: riders({ activities: [InvestitureOfIce.CONE_ID], effects: [InvestitureOfIce.RIDER_EFFECT_ID] }),
          },
        },
      },
      {
        name: "Investiture of Ice: Slowed",
        activityMatch: "Freezing Cone",
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
        ],
        options: {
          // "speed halved until the start of your next turn": the caster's turn, not the target's
          expiry: "sourceStart",
        },
      },
    ];
  }

}
