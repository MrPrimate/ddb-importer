import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

/** One option of the spell: a self-enchantment profile and what it rides in while applied. */
interface IAlterSelfOption {
  /** Id-safe key, unique across the options. */
  key: string;
  label: string;
  img: string;
  /** Changes of the caster's effect carried as an effect rider; null for an option with no effect. */
  riderChanges: IActiveEffectChangeData[] | null;
  /** Ids of the activities that only exist on the spell while this option is applied. */
  activityRiders: string[];
}

/**
 * The spell is a self-enchantment with one profile per option, so the three options are
 * exclusive: casting applies the chosen one, and while one is applied the activity becomes
 * "Change Option" and spends no slot, which is the Magic action that swaps option during the
 * spell (the same option again ends it). Aquatic Adaptation and Change Appearance carry an effect
 * on the caster as a rider. Natural Weapons carries an enchant activity as a rider: while that
 * option is active the activity's chat card takes the caster's Unarmed Strike (any natural
 * weapon) and turns it into the grown weapon, so attacks stay on the real Unarmed Strike. dnd5e
 * links that enchantment to nothing, so the RiderEnchantmentLink enhancer makes it depend on the
 * applied option, and swapping option or losing concentration removes it. A form-mode transform
 * could not offer this option: a form is an effect on the actor and cannot hold an activity.
 */
export default class AlterSelf extends DDBEnricherData {

  static ACTIVITY_NAME = "Alter Self";

  static ACTIVITY_ID = "ddbAlterSelfEnch";

  static NATURAL_WEAPONS_NAME = "Natural Weapons";

  static NATURAL_WEAPONS_ID = "ddbAlterSelfNatW";

  static NATURAL_WEAPONS_ENCHANTMENT_ID = utils.namedIDStub("Weapons", { prefix: "alt", postfix: "str" });

  /** A getter: the change helpers are not safe to call while the barrel is still loading. */
  static get OPTIONS(): IAlterSelfOption[] {
    return [
      {
        key: "Aquatic",
        label: "Aquatic Adaptation",
        img: "icons/creatures/fish/fish-bluefin-yellow-blue.webp",
        riderChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 5, "system.attributes.movement.swim"),
        ],
        activityRiders: [],
      },
      {
        key: "Appearance",
        label: "Change Appearance",
        img: "icons/creatures/magical/spirit-undead-ghost-blue.webp",
        riderChanges: [],
        activityRiders: [],
      },
      {
        key: "Weapons",
        label: "Natural Weapons",
        img: "icons/creatures/abilities/fang-tooth-blood-red.webp",
        riderChanges: null,
        activityRiders: [AlterSelf.NATURAL_WEAPONS_ID],
      },
    ];
  }

  static riderId(option: IAlterSelfOption): string {
    return utils.namedIDStub(option.key, { prefix: "alt", postfix: "rdr" });
  }

  static enchantmentId(option: IAlterSelfOption): string {
    return utils.namedIDStub(option.key, { prefix: "alt", postfix: "enc" });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: AlterSelf.ACTIVITY_NAME,
      id: AlterSelf.ACTIVITY_ID,
      data: {
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
          name: AlterSelf.NATURAL_WEAPONS_NAME,
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          img: "icons/creatures/abilities/fang-tooth-blood-red.webp",
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          generateHealing: false,
          generateRange: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            condition: "While Natural Weapons is the active option",
          },
          // dnd5e does not treat the copy it makes of a rider activity as a rider, so the copy
          // would inherit the spell's concentration and using it would end the spell; spell
          // activities only take a duration override when duration generation is on
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          data: {
            restrictions: {
              type: "weapon",
              categories: ["natural"],
              allowMagical: true,
            },
          },
        },
        overrides: {
          noConsumeTargets: true,
          id: AlterSelf.NATURAL_WEAPONS_ID,
        },
      },
    ];
  }

  /**
   * The enchantment the Natural Weapons activity puts on the Unarmed Strike. 2024: 1d6 of a
   * chosen physical type, attacking with the spellcasting ability. 2014: a magic 1d6 natural
   * weapon with +1 to attack and damage.
   */
  get naturalWeaponsHint(): IDDBEffectHint {
    const hint: IDDBEffectHint = {
      name: "Alter Self: Natural Weapons",
      img: "icons/creatures/abilities/fang-tooth-blood-red.webp",
      type: "enchant",
      activityMatch: AlterSelf.NATURAL_WEAPONS_NAME,
      options: {
        durationSeconds: 3600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange("{} [Natural Weapons]", 20, "name"),
        DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.damage.base.number"),
        DDBEnricherData.ChangeHelper.overrideChange("6", 20, "system.damage.base.denomination"),
        // the Unarmed Strike's damage is a custom formula, which would win over the die
        DDBEnricherData.ChangeHelper.overrideChange("false", 20, "system.damage.base.custom.enabled"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.damage.base.types"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.damage.base.types"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.damage.base.types"),
      ],
      data: {
        _id: AlterSelf.NATURAL_WEAPONS_ENCHANTMENT_ID,
      },
    };
    if (this.is2014) {
      hint.magicalBonus = { makeMagical: true, bonus: "1" };
    } else {
      // not the legacy "system.ability" key: dnd5e 6 maps that onto the derived attack.abilities
      // set, where "spellcasting" is no ability and the strike's own Str / Dex always win
      hint.changes?.push(DDBEnricherData.ChangeHelper.overrideChange("spellcasting", 20, "activities[attack].attack.ability"));
    }
    return hint;
  }

  /** The caster's effect for an option, copied onto the spell when its profile is applied. */
  riderHint(option: IAlterSelfOption): IDDBEffectHint {
    return {
      name: `Alter Self: ${option.label}`,
      img: option.img,
      options: {
        transfer: true,
        durationSeconds: 3600,
      },
      changes: option.riderChanges ?? [],
      data: {
        _id: AlterSelf.riderId(option),
      },
    };
  }

  /** The enchantment profile for an option. While applied, the cast becomes the free option swap. */
  enchantmentHint(option: IAlterSelfOption): IDDBEffectHint {
    return {
      name: option.label,
      img: option.img,
      type: "enchant",
      activityMatch: AlterSelf.ACTIVITY_NAME,
      options: {
        durationSeconds: 3600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange("Change Option", 20, `system.activities.${AlterSelf.ACTIVITY_ID}.name`),
        DDBEnricherData.ChangeHelper.overrideChange("false", 20, `system.activities.${AlterSelf.ACTIVITY_ID}.consumption.spellSlot`),
      ],
      data: {
        _id: AlterSelf.enchantmentId(option),
        flags: {
          ddbimporter: {
            effectRiders: option.riderChanges ? [AlterSelf.riderId(option)] : [],
            activityRiders: option.activityRiders,
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const options = AlterSelf.OPTIONS;
    return [
      ...options.filter((option) => option.riderChanges).map((option) => this.riderHint(option)),
      ...options.map((option) => this.enchantmentHint(option)),
      this.naturalWeaponsHint,
    ];
  }

}
