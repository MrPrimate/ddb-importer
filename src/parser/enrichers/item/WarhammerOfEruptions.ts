import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Warhammer of Eruptions: once smoldering (after its first hit in a combat) it adds 1d6 fire, and
 * at the end of your third turn smoldering it erupts in a 30 foot cone with no action: a Dexterity
 * save against 3d6 fire and 3d6 lightning, half on a success. It then rests for 2d6 hours.
 */
export default class WarhammerOfEruptions extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
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
