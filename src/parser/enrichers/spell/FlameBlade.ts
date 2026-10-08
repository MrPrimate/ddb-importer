import DDBEnricherData from "../data/DDBEnricherData";
import { endSpellChanges, riders, selfEnchantCast, slotLevels } from "./_SelfEnchantSpell";

/**
 * Summoning the blade is a self-enchantment (see _SelfEnchantSpell): its light is an effect rider
 * and Attack an activity rider, so the attack only appears while the spell lasts. The attack is
 * used without a slot, so each slot level has its own profile setting the attack's dice: 1d6 per
 * two levels above 2nd in 2014, 1d6 per level in 2024.
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

  damagePart(level: number): I5eDamagePart {
    const extra = this.is2014 ? Math.floor((level - 2) / 2) : level - 2;
    return DDBEnricherData.basicDamagePart({
      number: 3 + extra,
      denomination: 6,
      bonus: this.is2014 ? "" : "@mod",
      types: ["fire"],
    });
  }

  override get effects(): IDDBEffectHint[] {
    const light: IDDBEffectHint = {
      name: "Flame Blade",
      options: {
        transfer: true,
        durationSeconds: 600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "token.light.dim"),
        DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.bright"),
        DDBEnricherData.ChangeHelper.overrideChange("#a78942", 20, "token.light.color"),
        DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
        DDBEnricherData.ChangeHelper.overrideChange("4", 20, "token.light.animation.intensity"),
        DDBEnricherData.ChangeHelper.overrideChange("torch", 20, "token.light.animation.type"),
        DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.speed"),
      ],
      data: {
        _id: FlameBlade.RIDER_EFFECT_ID,
      },
    };
    const profiles: IDDBEffectHint[] = slotLevels(2).map(({ level, effectIdLevel }) => {
      const part = this.damagePart(level);
      return {
        name: `Flame Blade (${part.number}d6)`,
        type: "enchant",
        activityMatch: FlameBlade.CAST_NAME,
        options: {
          durationSeconds: 600,
        },
        changes: [
          ...endSpellChanges(FlameBlade.CAST_ID, "Dismiss Flame Blade"),
          // a single part, not an array: see DragonsBreath
          DDBEnricherData.ChangeHelper.overrideChange(JSON.stringify(part), 20, "activities[attack].damage.parts"),
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
              parts: [this.damagePart(2)],
            },
          },
        },
      },
    ];
  }

}
