import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "../../data/RegionBuilders";

/**
 * A passive emanation, 10 feet growing to 30 at level 18, that fires a Constitution save against
 * the paladin's spell save DC at a hostile creature ending its turn inside. Only a creature
 * concentrating on a spell saves, which a region cannot test, so the card is ignored for the
 * rest. DDB records the aura's size as the save's damage; it is the template size here. Hiding
 * allies from scrying sensors has no effect form.
 */
export default class AuraOfDisruption extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Place Aura", {
      template: { type: "radius", size: "@scale.spelldrinker.aura-of-disruption" },
      affects: "enemy",
      activationType: "special",
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenTurnEnd"],
          activityName: "Disruption Save",
          excludeSelf: true,
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Disruption Save", {
        affects: "enemy",
        condition: "A hostile creature ends its turn in the aura while concentrating on a spell: on a failure it loses Concentration",
        save: { ability: ["con"], calculation: "spellcasting" },
      }),
    ];
  }

}
