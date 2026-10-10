import DDBEnricherData from "../data/DDBEnricherData";
import { conditionalWeaponDamage, noExtraAttackDamage, unrestrictedDamageParts } from "./_ItemActivities";

/**
 * Volcanic Fury rolls its save as the ground erupts, once per dawn, and leaves the 20-foot cube
 * as rubble: difficult terrain until someone clears it, so the area it places is permanent. The
 * DC is the one DDB gives. The extra 1d8 fire lands only while raging, so it is its own damage
 * activity rather than part of every hit.
 */
export default class FuriousFlail extends DDBEnricherData {

  // the parser builds its own Dex save from the Volcanic Fury text; the Volcanic Fury save below
  // replaces it, so the parsed one is suppressed rather than doubled
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData | null {
    return unrestrictedDamageParts(this).length > 0 ? noExtraAttackDamage() : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const raging = unrestrictedDamageParts(this);
    return [
      ...(raging.length > 0 ? [conditionalWeaponDamage("Raging Fire", raging, "While you are raging, on a hit with the flail")] : []),
      {
        init: { name: "Volcanic Fury", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "26" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 12, types: ["bludgeoning"] }),
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 12, types: ["fire"] }),
          ],
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: null,
            condition: "A point within the weapon's reach; each creature in the area other than you. The rubble left behind is difficult terrain",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "cube", size: "20" },
          },
          rangeOverride: { override: true, value: "10", units: "ft" },
          durationOverride: { override: true, units: "perm" },
        },
        overrides: {
          addItemConsume: true,
          noeffect: true,
          data: {
            damage: { onSave: "half" },
          },
        },
      },
    ];
  }

}
