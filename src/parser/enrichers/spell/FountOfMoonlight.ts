import DDBEnricherData from "../data/DDBEnricherData";
import { endSpellChanges, riders, selfEnchantCast } from "./_SelfEnchantSpell";

/**
 * Cast as a self-enchantment (see _SelfEnchantSpell): the moonlight on the caster is an effect
 * rider and Force Blinding Save an activity rider, so the reaction only appears while the spell
 * lasts.
 */
export default class FountOfMoonlight extends DDBEnricherData {

  static CAST_ID = "ddbFountMoonCast";

  static SAVE_ID = "ddbFountMoonSave";

  static RIDER_EFFECT_ID = "ddbFountMoonRidr";

  static PROFILE_ID = "ddbFountMoonEnch";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return selfEnchantCast({ name: "Cast Spell", id: FountOfMoonlight.CAST_ID });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Force Blinding Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          generateDamage: false,
          generateSave: true,
          noSpellslot: true,
          rangeOverride: {
            value: "60",
            units: "ft",
            special: "",
          },
          targetOverride: {
            affects: {
              type: "creature",
              count: "1",

            },
            template: {
              count: "",
              contiguous: false,
              type: "",
              size: "",
              width: "",
              height: "",
              units: "ft",
            },
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
        overrides: {
          id: FountOfMoonlight.SAVE_ID,
          activationType: "reaction",
          overrideActivation: true,
          activationCondition: "While Fount of Moonlight lasts: a creature you can see within 60 feet damages you with a melee attack roll",
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wreathed in Moonlight",
        options: {
          transfer: true,
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("2d6[radiant]", 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("2d6[radiant]", 20, "system.rolls.damage.msak.bonus"),
          DDBEnricherData.ChangeHelper.upgradeChange("40", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#97a9ab", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
        ],
        data: {
          _id: FountOfMoonlight.RIDER_EFFECT_ID,
        },
      },
      {
        name: "Fount of Moonlight",
        type: "enchant",
        activityMatch: "Cast Spell",
        options: {
          durationSeconds: 600,
        },
        changes: endSpellChanges(FountOfMoonlight.CAST_ID, "End Fount of Moonlight"),
        data: {
          _id: FountOfMoonlight.PROFILE_ID,
          flags: {
            ddbimporter: riders({ activities: [FountOfMoonlight.SAVE_ID], effects: [FountOfMoonlight.RIDER_EFFECT_ID] }),
          },
        },
      },
      {
        name: "Blinded by Moonlight",
        activityMatch: "Force Blinding Save",
        options: {
          durationSeconds: 6,
        },
        statuses: ["Blinded"],
      },
    ];
  }

}
