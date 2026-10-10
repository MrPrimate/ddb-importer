import DDBEnricherData from "../data/DDBEnricherData";
import { castLevelChanges, endSpellChanges, riders, selfEnchantCast, slotLevels } from "./_SelfEnchantSpell";

/**
 * Summoning the blade is a self-enchantment (see _SelfEnchantSpell): its light is an effect rider
 * and Attack an activity rider, so the attack only appears while the spell lasts. The attack is
 * used without a slot, so each slot level has its own profile fixing the spell at the cast level:
 * the attack then scales by itself (1d6 per two levels above 2nd in 2014, 1d6 per level in 2024)
 * and its use asks for no level.
 */
export default class FlameBlade extends DDBEnricherData {

  static CAST_NAME = "Summon Blade";

  static CAST_ID = "ddbFlameBladeSmn";

  static ATTACK_ID = "ddbFlameBladeAtk";

  static RIDER_EFFECT_ID = "ddbFlameBladeLgt";

  static profileId(level: number): string {
    return `ddbFlameBladeEn${level}`;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return selfEnchantCast({ name: FlameBlade.CAST_NAME, id: FlameBlade.CAST_ID });
  }

  get damagePart(): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({
      number: 3,
      denomination: 6,
      bonus: this.is2014 ? "" : "@mod",
      types: ["fire"],
      scalingMode: this.is2014 ? "half" : "whole",
      scalingNumber: 1,
    });
  }

  /** The attack's dice at a cast level, for the profile names. */
  dice(level: number): number {
    return 3 + (this.is2014 ? Math.floor((level - 2) / 2) : level - 2);
  }

  override get effects(): IDDBEffectHint[] {
    const light: IDDBEffectHint = {
      name: "Flame Blade",
      options: {
        transfer: true,
        durationSeconds: 600,
      },
      atlChanges: [
        DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "ATL.light.dim"),
        DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "ATL.light.bright"),
        DDBEnricherData.ChangeHelper.overrideChange("#a78942", 20, "ATL.light.color"),
        DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "ATL.light.alpha"),
        DDBEnricherData.ChangeHelper.overrideChange("4", 20, "ATL.light.animation.intensity"),
        DDBEnricherData.ChangeHelper.overrideChange("torch", 20, "ATL.light.animation.type"),
        DDBEnricherData.ChangeHelper.overrideChange("2", 20, "ATL.light.animation.speed"),
      ],
      data: {
        _id: FlameBlade.RIDER_EFFECT_ID,
      },
    };
    const profiles: IDDBEffectHint[] = slotLevels(2).map(({ level, effectIdLevel }) => {
      return {
        name: `Flame Blade (${this.dice(level)}d6)`,
        type: "enchant",
        activityMatch: FlameBlade.CAST_NAME,
        options: {
          durationSeconds: 600,
        },
        changes: [
          ...endSpellChanges(FlameBlade.CAST_ID, "Dismiss Flame Blade"),
          ...castLevelChanges(level, 2),
        ],
        data: {
          _id: FlameBlade.profileId(level),
          flags: {
            ddbimporter: {
              ...riders({ activities: [FlameBlade.ATTACK_ID], effects: [FlameBlade.RIDER_EFFECT_ID] }),
              effectIdLevel,
            },
          },
        },
      };
    });
    return [light, ...profiles];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          noSpellslot: true,
          generateRange: true,
          generateTarget: true,
        },
        overrides: {
          id: FlameBlade.ATTACK_ID,
          activationType: "action",
          overrideActivation: true,
          targetType: "creature",
          data: {
            range: {
              value: 5,
              units: "ft",
            },
            damage: {
              parts: [this.damagePart],
            },
          },
        },
      },
    ];
  }

}
