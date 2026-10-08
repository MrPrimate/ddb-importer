import DDBEnricherData from "../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../data/SelfEnchant";

/**
 * AU 2024: the doll levitates within 30 feet for a minute and can be moved or dismissed.
 * Levitating it is a self-enchantment whose rider is Move Doll, so moving it only appears while it
 * levitates, and using the levitation again ends it.
 */
export default class SpellSlingersPuppet extends DDBEnricherData {

  static MOVE_ID = "ddbPuppetMove001";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Levitate Doll",
      targetType: "self",
      activationType: "bonus",
      noTemplate: true,
      data: {
        range: { value: "30", units: "ft" },
        duration: { value: "1", units: "minute" },
        enchant: {
          self: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Move Doll",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateConsumption: false,
          activationOverride: { type: "bonus", value: 1, condition: "While the doll levitates" },
          rangeOverride: { value: "30", units: "ft" },
        },
        overrides: {
          id: SpellSlingersPuppet.MOVE_ID,
          targetType: "space",
          noTemplate: true,
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Levitating Doll",
        type: "enchant",
        activityMatch: "Levitate Doll",
        options: {
          transfer: false,
        },
        changes: toggleOffChanges("End Levitation"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [SpellSlingersPuppet.MOVE_ID] }),
          },
        },
      },
    ];
  }

}
