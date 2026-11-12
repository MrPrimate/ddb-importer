import DDBEnricherData from "../data/DDBEnricherData";
import { followUpDamage } from "./_FollowUpDamage";

/**
 * World of Warcraft (Warlock): the meteor's save deals 2d8 Fire plus 2d8 Necrotic; for the duration
 * a creature that enters the Sphere or ends its turn there saves against 1d8 Fire plus 1d8 Necrotic.
 * DDB lists all four parts on one save.
 */
export default class HandOfGuldan extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Meteor",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["fire"], scalingMode: "none" }),
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["necrotic"], scalingMode: "none" }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      followUpDamage({
        name: "Fel Imps",
        parts: [2, 3],
        save: "dex",
        condition: "A creature enters the Sphere or ends its turn there (once per turn)",
      }),
    ];
  }

}
