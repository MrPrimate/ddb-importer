import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. The 15-foot emanation follows the caster and rolls its
 * damage, with no save, for any other creature that enters it or starts its turn there. The
 * caster's own healing happens on the caster's turn, which a region cannot see.
 */
export default class Lifesink extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: "Lifesink Damage",
        excludeSelf: true,
      }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: "Lifesink Damage",
        condition: "Any other creature enters the emanation or starts its turn there",
        noSave: true,
      }),
      {
        init: { name: "Regain Hit Points", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateHealing: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          healingPart: DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, types: ["healing"], scalingMode: "none" }),
          activationOverride: { type: "special", value: null, condition: "Start of your turn: add 1 for each creature in the emanation" },
          targetOverride: { override: true, affects: { type: "self" }, template: {} },
        },
      },
    ];
  }

}
