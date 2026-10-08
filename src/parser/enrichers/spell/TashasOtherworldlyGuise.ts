import DDBEnricherData from "../data/DDBEnricherData";
import { endSpellChanges, riders, selfEnchantCast } from "./_SelfEnchantSpell";

/**
 * Cast as a self-enchantment (see _SelfEnchantSpell) with one profile per plane, so the two are
 * exclusive. Each profile carries that plane's effect on the caster and the Otherworldly Weapon
 * enchant activity as riders, so the weapon activity only appears while the spell lasts. The
 * RiderEnchantmentLink enhancer ties the weapon's enchantment to the applied profile, so ending the
 * spell or losing concentration also ends the weapon's.
 */
export default class TashasOtherworldlyGuise extends DDBEnricherData {

  static CAST_ID = "ddbOtherworldlyC";

  static WEAPON_ID = "ddbOtherworldlyW";

  static PLANES = [
    { key: "Upper", label: "Upper Planes", riderId: "ddbOtherworldUpR", profileId: "ddbOtherworldUpE" },
    { key: "Lower", label: "Lower Planes", riderId: "ddbOtherworldLoR", profileId: "ddbOtherworldLoE" },
  ];

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return selfEnchantCast({ id: TashasOtherworldlyGuise.CAST_ID });
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  planeChanges(key: string): IActiveEffectChangeData[] {
    const sharedChanges = [
      DDBEnricherData.ChangeHelper.upgradeChange("40", 20, "system.attributes.movement.speeds.fly"),
      DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
    ];
    if (key === "Upper") {
      return [
        DDBEnricherData.ChangeHelper.damageImmunityChange("radiant"),
        DDBEnricherData.ChangeHelper.damageImmunityChange("necrotic"),
        DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
      ].concat(sharedChanges);
    }
    return [
      DDBEnricherData.ChangeHelper.damageImmunityChange("fire"),
      DDBEnricherData.ChangeHelper.damageImmunityChange("poison"),
      DDBEnricherData.ChangeHelper.conditionImmunityChange("poisoned"),
    ].concat(sharedChanges);
  }

  override get effects(): IDDBEffectHint[] {
    const planes = TashasOtherworldlyGuise.PLANES;
    const planeEffects: IDDBEffectHint[] = planes.map((plane) => ({
      name: plane.label,
      changes: this.planeChanges(plane.key),
      options: {
        transfer: true,
        durationSeconds: 60,
      },
      data: {
        _id: plane.riderId,
      },
    }));
    const profiles: IDDBEffectHint[] = planes.map((plane) => ({
      name: plane.label,
      type: "enchant",
      activityMatch: "Cast",
      options: {
        durationSeconds: 60,
      },
      changes: endSpellChanges(TashasOtherworldlyGuise.CAST_ID, "End Otherworldly Guise"),
      data: {
        _id: plane.profileId,
        flags: {
          ddbimporter: riders({ activities: [TashasOtherworldlyGuise.WEAPON_ID], effects: [plane.riderId] }),
        },
      },
    }));
    return [
      ...planeEffects,
      ...profiles,
      {
        name: "Otherworldly Weapon",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Otherworldly Weapon]`, 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.properties"),
          // the legacy "system.ability" key cannot carry "spellcasting" in dnd5e 6, see AlterSelf
          DDBEnricherData.ChangeHelper.overrideChange("spellcasting", 20, "activities[attack].attack.ability"),
        ],
        activityMatch: "Otherworldly Weapon",
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Otherworldly Weapon",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          // the enchantment takes this activity's duration: the spell's, without concentration
          noConcentration: true,
          img: "icons/magic/holy/angel-wings-gray.webp",
          generateDamage: false,
          generateHealing: false,
          generateRange: false,
          generateConsumption: false,
          noSpellslot: true,
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
        overrides: {
          id: TashasOtherworldlyGuise.WEAPON_ID,
        },
      },
    ];
  }

}
