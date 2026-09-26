import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * A fixed 20-foot cube of webs, difficult terrain. Neither printing rolls anything as the webs
 * appear: the cast only places them, and the region fires "Ongoing Save" when a creature passes
 * into the webs for the first time on a turn or starts its turn there. Creating the webs on a
 * creature is not entering (enterOn "movement", per the 2014 design intent for this timing, which
 * the 2024 wording keeps). A failure applies Restrained for as long as the spell lasts; breaking
 * free and burning the webs are left to the table.
 */
export default class Web extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      ...castPlacer([
        DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["web"] }),
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: ONGOING,
          enterOn: "movement",
        }),
      ]),
      // the restrained icon is a web
      display: "status-restrained",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [ongoingTrigger({
      condition: "Enters the webs for the first time on a turn or starts its turn there",
      noDamage: true,
      // the Restrained it applies lasts as long as the spell
      keepSpellDuration: true,
    })];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained",
        activityMatch: ONGOING,
        statuses: ["Restrained"],
      },
    ];
  }

}
