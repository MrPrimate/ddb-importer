import DDBEnricherData from "../data/DDBEnricherData";
import { movementBehavior, movementDamage } from "./_SpellRegions";

const HALF_COVER = "Forest of Dread: Half Cover";

/**
 * The save is rolled as the bones sprout, so it stays the cast, with the first of DDB's two
 * damage parts. The cylinder is centred on the caster but does not follow them, which is what a
 * cylinder template does. Inside it is difficult terrain, gives Half Cover, and deals the second
 * part for every 5 feet moved, offered once per movement. The caster is immune to the movement
 * damage; difficult terrain is ignored by disposition and never by one token.
 */
export default class ForestOfDread extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 4, denomination: 8, types: ["piercing"] }),
      ],
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: HALF_COVER }),
          movementBehavior(true),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      movementDamage("2d8 Piercing", [1]),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: HALF_COVER,
        standalone: true,
        statuses: ["coverHalf"],
        // held only while inside: the region removes it on exit, so it carries no expiry of its own
        options: { expiry: null, durationSeconds: null },
      },
    ];
  }

}
