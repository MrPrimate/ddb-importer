import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, emanation, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. The aura belongs to the chosen creature, so the cast
 * places a 20-foot emanation on the Festival King's token (click the king when placing), which then
 * follows it; the aura moving onto a creature is not that creature moving within 20 feet (enterOn
 * "movement"). The king is not within 20 feet of itself, so the region skips the token it is
 * attached to, and with it the caster (excludeSelf covers both). DDB gives the spell no template.
 */
export default class FestivalKing extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        enterOn: "movement",
        excludeSelf: true,
        activityName: ONGOING,
      }),
    ], { target: emanation("20") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Moves within 20 feet of the Festival King for the first time on a turn or starts its turn there; automatic success if it can't be charmed",
        noDamage: true,
        // the enamored effect lasts as long as the spell
        keepSpellDuration: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Enamored with the Festival King",
        activityMatch: ONGOING,
        options: {
          transfer: false,
          description: "Spends its action and Bonus Action at the start of its turn admiring the Festival King. Ends if it starts its turn outside the aura.",
        },
      },
    ];
  }

}
