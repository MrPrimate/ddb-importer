import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "./_ItemRegions";

/**
 * The field rolls its Charisma save as it appears, so throwing the coaster is the save, and its
 * region fires that same save again for a creature that enters the field or starts its turn
 * there. The Wisdom save a creature makes before a hostile act is rolled by hand.
 */
export default class BartendersArmistice extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Throw Coaster", {
      template: { type: "cylinder", size: "30", height: "15" },
      range: "30",
      duration: { value: "10", units: "minute" },
      save: { ability: ["cha"], dc: "15" },
      linkEffects: true,
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Hostile Act Save", {
        condition: "Attacks or casts a harmful spell that affects a target in the field or crosses its edge; on a failure the action is wasted",
        save: { ability: ["wis"], dc: "15" },
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Charmed (Armistice)",
        activityMatch: "Throw Coaster",
        statuses: ["Charmed"],
        options: {
          transfer: false,
          description: "Charmed while it remains in the field, and indifferent to creatures it is hostile toward. Ends if it is attacked, harmed by a spell, or sees a friend harmed.",
        },
      },
    ];
  }

}
