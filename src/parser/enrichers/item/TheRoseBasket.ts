import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "../data/RegionBuilders";

const ROSE_THORNS = "Rose Thorns";

/**
 * Field of Roses turns a 25-foot square around the wielder into rosebushes for 1 minute, once a
 * day: difficult terrain that tears at a creature for every 5 feet it moves, which a region can
 * only offer once per movement. It stays where it sprouted. The wielder takes no thorn damage,
 * so the offer skips them, but difficult terrain is ignored by disposition and never by one token.
 */
export default class TheRoseBasket extends DDBEnricherData {

  // the parser reads the thorns as a second weapon attack; the radiant rider against a Fey or a
  // shape-shifted creature is rebuilt below
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Attack: Fey or Shape-Shifted", type: DDBEnricherData.ACTIVITY_TYPES.ATTACK },
        build: {
          generateAttack: true,
          generateDamage: true,
          includeBaseDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["radiant"] }),
          ],
          chatFlavor: "Against a Fey or a creature that is shape-shifted",
        },
        // the item's one daily use belongs to Field of Roses, not to a swing of the blade
        overrides: { noConsumeTargets: true },
      },
      regionPlacer("Field of Roses", {
        template: { type: "square", size: "25" },
        activationCondition: "Centred on your location; dismissed as a Bonus Action",
        duration: { value: "1", units: "minute" },
        consume: true,
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["plants"] }),
          DDBEnricherData.BehaviorHelper.activity({
            // an entering movement also has a move-within segment, so move-in would card it twice
            events: ["tokenMoveWithin"],
            activityName: ROSE_THORNS,
            oncePerTurn: false,
            excludeSelf: true,
          }),
        ],
      }),
      regionTrigger(ROSE_THORNS, {
        condition: "Moves into or within the rosebushes (2d4 Piercing for every 5 feet moved)",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["piercing"] }),
        ],
      }),
    ];
  }

}
