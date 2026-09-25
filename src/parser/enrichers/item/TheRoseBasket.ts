import DDBEnricherData from "../data/DDBEnricherData";
import { areaPlacer, areaTrigger } from "../data/AreaBuilders";

const ROSE_THORNS = "Rose Thorns";

/**
 * Field of Roses turns a 25-foot square around the wielder into rosebushes for 1 minute, once a
 * day: difficult terrain that tears at a creature for every 5 feet it moves, rolled by hand. It
 * stays where it sprouted. The wielder takes no thorn damage.
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
      areaPlacer("Field of Roses", {
        template: { type: "square", size: "25" },
        activationCondition: "Centred on your location; difficult terrain, dismissed as a Bonus Action",
        duration: { value: "1", units: "minute" },
        consume: true,
      }),
      areaTrigger(ROSE_THORNS, {
        condition: "A creature other than you moves into or within the rosebushes (2d4 Piercing for every 5 feet moved)",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["piercing"] }),
        ],
      }),
    ];
  }

}
