import DDBEnricherData from "../data/DDBEnricherData";
import { movementDamage } from "./_SpellAreas";

/**
 * The save is rolled as the bones sprout, so it stays the cast, with the first of DDB's two
 * damage parts. The cylinder is centred on the caster but does not follow them, which is what a
 * cylinder template does. Inside it is difficult terrain, gives Half Cover, and deals the second
 * part for every 5 feet moved, rolled by hand. The caster is immune to the movement damage.
 */
export default class ForestOfDread extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 4, denomination: 8, types: ["piercing"] }),
      ],
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      movementDamage("2d8 Piercing", [1]),
    ];
  }

}
