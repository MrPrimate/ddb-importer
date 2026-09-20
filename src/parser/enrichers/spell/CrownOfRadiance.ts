import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, emanation, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. The crown is an emanation on the caster, 20 feet in the
 * legacy printing and 30 feet in the current one, that rolls its damage with no save for a Fiend,
 * Fey or Undead that moves within it or begins its turn there. The crown also sheds light.
 */
export default class CrownOfRadiance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      ...castPlacer([
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: "Crown Damage",
          types: ["fiend", "fey", "undead"],
          excludeSelf: true,
        }),
      ], { target: emanation(this.is2014 ? "20" : "30") }),
      // the light is the caster's own, gained with the cast
      noeffect: false,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: "Crown Damage",
        condition: "A Fiend, Fey or Undead moves within the crown's radius or begins its turn there",
        noSave: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Crown of Radiance: Light",
        activityMatch: "Cast",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange("#fff2c2", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
        ],
        options: { transfer: false },
      },
    ];
  }

}
