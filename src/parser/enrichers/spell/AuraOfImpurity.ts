import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, emanation, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. DDB records the aura as a sphere, so it is restated as a
 * 30-foot emanation to follow the caster, and it fires the save at a creature that enters it or
 * starts its turn there.
 * It harms creatures of the caster's choice, which a region cannot ask, so it fires for enemies.
 */
export default class AuraOfImpurity extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: ONGOING,
        excludeSelf: true,
      }),
    ], { target: emanation("30", "enemy") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Enters the aura for the first time on its turn or starts its turn there",
        affects: "enemy",
        noDamage: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Drained",
        activityMatch: ONGOING,
        changes: [DDBEnricherData.ChangeHelper.ruleBonusChange("d20", "-1d4")],
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "Subtracts 1d4 from every ability check, attack roll and saving throw, and regains only half of any Hit Points, until the end of its next turn.",
        },
      },
    ];
  }

}
