import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, emanation, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. DDB gives the spell neither a template nor a save, so both
 * are restated: a 15-foot emanation that follows the caster, difficult terrain, firing a Dexterity
 * save at a creature that enters it or ends its turn there, never at the caster.
 */
export default class Tremor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.difficultTerrain(),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnEnd"],
        activityName: ONGOING,
        excludeSelf: true,
      }),
    ], { target: emanation("15") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Enters the emanation or ends its turn there, or the emanation enters its space (once per turn)",
        saveAbility: "dex",
      }),
    ];
  }

}
