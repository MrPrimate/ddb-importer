import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import { riders, toggleOffChanges } from "../data/SelfEnchant";
import WeaponProperties from "./_WeaponProperties";
import HoardItem from "./_HoardItem";
import { itemActivity, itemCast, itemProperty, shippedItemSpellNames } from "./_ItemActivities";

/**
 * Stormgirdle, a staged artifact (Dormant, Awakened, Exalted). Worn, it grants resistance to
 * lightning and thunder damage and a Strength of 21, 23 or 25. Once per dawn its wearer becomes a
 * Storm Avatar for 1 minute: immune to lightning and thunder damage, weapon hits deal thunder or
 * lightning instead, a bonus action lightning strike (DC 15 Dexterity, 3d6, 4d6 Awakened, 5d6
 * Exalted), and from Awakened a 30-foot flying speed with hover. Exalted casts Control Weather once
 * per dawn.
 *
 * DDB's stage records grant the immunities permanently, where the text gives resistance outside
 * the Storm Avatar, so the parser's effect is replaced.
 *
 * Becoming the Storm Avatar is a self-enchantment whose riders are the avatar's effect and
 * Lightning Strike, so the strike only appears while the avatar lasts.
 */
export default class Stormgirdle extends WeaponProperties {

  static AVATAR = "Storm Avatar";

  static STRIKE = "Lightning Strike";

  static AVATAR_EFFECT_ID = "ddbStormgirdleAv";

  static riderId(name: string): string {
    return utils.namedIDStub(name, { prefix: "ddbItem" });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [
      HoardItem.oncePerDawn(itemActivity(Stormgirdle.AVATAR, DDBEnricherData.ACTIVITY_TYPES.ENCHANT, {
        noeffect: false,
        data: { enchant: { self: true } },
      }, {
        activationOverride: { type: "action", value: 1, condition: "" },
        generateDuration: true,
        durationOverride: { override: true, value: "1", units: "minute" },
      })),
      itemProperty(Stormgirdle.STRIKE, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3 + this.stage, denomination: 6, types: ["lightning"] })],
        onSave: "half",
        activationType: "bonus",
        condition: "While you are a Storm Avatar: one creature you can see",
        range: { value: "30", units: "ft" },
        noeffect: true,
        data: { duration: { override: true, value: "", units: "inst", special: "" } },
      }),
    ];
    if (this.stage >= 2 && !shippedItemSpellNames(this).includes("Control Weather")) {
      activities.push(HoardItem.oncePerDawn(itemCast("Control Weather")));
    }
    return activities;
  }

  // DDB's permanent immunities are replaced by the enricher's own effects, see above
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return this.noItemUses;
  }

  override get effects(): IDDBEffectHint[] {
    const avatarChanges = [
      DDBEnricherData.ChangeHelper.damageImmunityChange("lightning"),
      DDBEnricherData.ChangeHelper.damageImmunityChange("thunder"),
    ];
    if (this.stage >= 1) {
      avatarChanges.push(
        DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.speeds.fly"),
        DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
      );
    }
    return [
      {
        name: "Stormgirdle",
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("lightning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("thunder"),
          DDBEnricherData.ChangeHelper.upgradeChange(`${21 + (2 * this.stage)}`, 20, "system.abilities.str.value"),
        ],
        // the item text's "1 minute" is the Storm Avatar's, not the worn girdle's
        options: { transfer: true, durationSeconds: null, expiry: null },
      },
      {
        name: Stormgirdle.AVATAR,
        changes: avatarChanges,
        options: {
          transfer: true,
          durationSeconds: 60,
          description: "Weapon attacks that normally deal bludgeoning damage deal thunder damage instead, and those that deal piercing or slashing damage deal lightning damage instead.",
        },
        data: {
          _id: Stormgirdle.AVATAR_EFFECT_ID,
        },
      },
      {
        name: Stormgirdle.AVATAR,
        type: "enchant",
        activityMatch: Stormgirdle.AVATAR,
        options: {
          transfer: false,
        },
        changes: toggleOffChanges("End Storm Avatar"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [Stormgirdle.riderId(Stormgirdle.STRIKE)], effects: [Stormgirdle.AVATAR_EFFECT_ID] }),
          },
        },
      },
    ];
  }

}
