import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. The globe treats the two sides differently: creatures
 * the caster designates are concealed (Advantage on Stealth), everyone else is dazzled
 * (Disadvantage on Perception) and saves against being blinded on entering or starting a turn
 * there. A region reads one disposition from its activity, so the cast targets allies and carries
 * the concealment, while the dazzle rides on the save the region fires at enemies.
 */
export default class GlobeOfTwilight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      ...castPlacer([
        DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Globe of Twilight: Concealed" }),
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: ONGOING,
        }),
      ]),
      targetType: "ally",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "A creature that is not concealed enters the globe for the first time or starts its turn there",
        affects: "enemy",
        noDamage: true,
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Globe of Twilight: Concealed",
        standalone: true,
        changes: [DDBEnricherData.ChangeHelper.advantageSkillChange("ste")],
        // held only while inside: the region removes it on exit, so it carries no expiry of its own
        options: { expiry: null, durationSeconds: null, description: "Advantage on Dexterity (Stealth) checks while in the globe, and may attempt to hide at any time." },
      },
      {
        name: "Blinded",
        activityMatch: ONGOING,
        statuses: ["Blinded"],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: "turnEnd",
          description: "Blinded until the end of its turn. Dazzled creatures also have Disadvantage on Perception checks inside the globe.",
        },
      },
    ];
  }

}
