import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { conditionalWeaponDamage, itemProperty, noExtraAttackDamage } from "./_ItemActivities";

/**
 * Warhammer of Eruptions: once smoldering (after its first hit in a combat) it adds 1d6 fire, and
 * at the end of your third turn smoldering it erupts in a 30 foot cone with no action: a Dexterity
 * save against 3d6 fire and 3d6 lightning, half on a success. It then rests for 2d6 hours.
 * The smoldering fire is its own damage activity, so the die is not part of every hit.
 */
export default class WarhammerOfEruptions extends WeaponProperties {

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      conditionalWeaponDamage(
        "Smoldering",
        [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["fire"] })],
        "On a hit while the hammer smolders: from its first hit in a combat until it erupts at the end of your third turn",
      ),
      itemProperty("Eruption", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "13" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["fire"] }),
          DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["lightning"] }),
        ],
        onSave: "half",
        condition: "Automatically at the end of your third turn with the hammer smoldering, in a direction of your choice",
        template: { type: "cone", size: "30" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
    ];
  }

}
