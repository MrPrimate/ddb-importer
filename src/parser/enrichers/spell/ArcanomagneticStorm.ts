import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. The storm is up to ten joined 10-foot cubes with two
 * saves of its own: Dexterity against the lightning for a creature that enters or starts its turn
 * there, and Strength against the force for one that ends its turn there. Each takes its own DDB
 * damage part. The area is difficult terrain only for ferrous creatures, which no filter can
 * pick out, so it is left off.
 */
export default class ArcanomagneticStorm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: "Lightning Save",
      }),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenTurnEnd"],
        activityName: "Force Save",
      }),
    ], {
      target: {
        override: true,
        affects: { type: "creature" },
        template: { count: "10", contiguous: true, type: "cube", size: "10", units: "ft" },
      },
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: "Lightning Save",
        condition: "Starts its turn in the storm or enters it for the first time on its turn",
        damageParts: [0],
      }),
      ongoingTrigger({
        name: "Force Save",
        condition: "Ends its turn in the storm (Disadvantage if made of ferrous metal or wearing ferrous armour)",
        damageParts: [1],
        saveAbility: "str",
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "Force Save",
        statuses: ["Prone"],
        options: { transfer: false },
      },
    ];
  }

}
