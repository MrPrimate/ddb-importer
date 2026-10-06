import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer } from "../data/RegionBuilders";
import { noExtraAttackDamage, unrestrictedDamageFormulas, weaponDamageBonus, weaponDamageEnchantment } from "./_ItemActivities";

/**
 * Volcanic Fury rolls its save as the ground erupts, once per dawn, and leaves the 20-foot cube
 * as rubble: difficult terrain until someone clears it, so the area it places is permanent. The
 * DC is the one DDB gives. The extra 1d8 fire lands only while raging, so it is a damage rule
 * gated on the Rage effect's "raging" status rather than part of every hit.
 */
export default class FuriousFlail extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    return unrestrictedDamageFormulas(this).length > 0 ? noExtraAttackDamage() : null;
  }

  override get effects(): IDDBEffectHint[] {
    const dice = unrestrictedDamageFormulas(this);
    if (dice.length === 0) return [];
    return [
      weaponDamageEnchantment(
        "Furious Flail: Raging Fire",
        dice.map((formula) => weaponDamageBonus(this, formula, [DDBEnricherData.ChangeHelper.statusFilter("raging")])),
        { description: "While you are raging, the flail deals an extra 1d8 fire damage to any target it hits." },
      ),
    ];
  }


  // the parser builds its own Dex save from the Volcanic Fury text; the region placer below
  // carries that save, so the parsed one is suppressed rather than doubled
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Volcanic Fury", {
        template: { type: "cube", size: "20" },
        range: "10",
        activationCondition: "A point within the weapon's reach; each creature in the area other than you",
        duration: { units: "perm" },
        consume: true,
        save: { ability: ["dex"], dc: "26" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 12, types: ["bludgeoning"] }),
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 12, types: ["fire"] }),
        ],
        onSave: "half",
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["rocks"] }),
        ],
      }),
    ];
  }

}
