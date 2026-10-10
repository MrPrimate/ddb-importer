import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Activating is a self-enchantment whose riders are the truesight effect and the banishing save,
 * so the save only appears for the minute Mortal Bulwark lasts.
 */
export default class MortalBulwark extends DDBEnricherData {

  static SAVE_ID = "ddbMortalBulwaSv";

  static EFFECT_ID = "ddbMortalBulwaEf";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Mortal Bulwark",
      addItemConsume: true,
      activationType: "bonus",
      targetType: "self",
      noTemplate: true,
      data: {
        duration: { value: "1", units: "minute" },
        enchant: {
          self: true,
        },
      },
    };
  }

  /**
   * @returns {DDBAdditionalActivity[]}
   */
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Banishment",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          durationOverride: {
            value: "",
            units: "inst",
          },
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "enemy",
            },
          },
        },
        overrides: {
          id: MortalBulwark.SAVE_ID,
          noConsumeTargets: true,
          data: {
            range: {
              units: "spec",
            },
            save: {
              ability: ["cha"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Mortal Bulwark",
        atlChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("truesight", 20, "ATL.sight.visionMode"),
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "ATL.sight.range"),
        ],
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.attributes.senses.ranges.truesight"),
        ],
        options: {
          transfer: true,
          durationSeconds: 60,
        },
        data: {
          _id: MortalBulwark.EFFECT_ID,
        },
      },
      {
        name: "Mortal Bulwark",
        type: "enchant",
        activityMatch: "Activate Mortal Bulwark",
        changes: toggleOffChanges("End Mortal Bulwark"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [MortalBulwark.SAVE_ID], effects: [MortalBulwark.EFFECT_ID] }),
          },
        },
      },
    ];
  }

}
