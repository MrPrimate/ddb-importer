import DDBEnricherData from "../data/DDBEnricherData";
import { ongoingClone } from "./_SpellRegions";

/**
 * The dust deals a flat 20 Force damage, with no save, to creatures of one type chosen as the
 * spell is cast, then again to one that enters the sphere or ends its turn there. DDB carries no
 * dice for it. The type is a per-cast choice, so the region cannot filter on it: set the type
 * filter on the activity's behavior before casting, or ignore the cards for other creatures.
 */
export default class DustOfSuleiman extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbDustSuleimDmg",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ customFormula: "20", types: ["force"], scalingMode: "none" }),
      ],
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbDustSuleimZn1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingClone(
        "ddbDustSuleimZn1",
        "A creature of the chosen type enters the dust or ends its turn there, or the dust moves into its space (once per turn)",
        "Ongoing Damage",
      ),
    ];
  }

}
