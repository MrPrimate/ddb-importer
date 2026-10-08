import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Adopting the visage is a self-enchantment whose riders are its effect and Frighten, so the
 * frightening save only appears while the visage lasts.
 */
export default class TerrifyingVisage extends DDBEnricherData {

  static FRIGHTEN_ID = "ddbTerrVisageFri";

  static EFFECT_ID = "ddbTerrVisageEff";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Adopt Visage",
      targetType: "self",
      noTemplate: true,
      activationType: "bonus",
      addItemConsume: true,
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
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
          name: "Frighten",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          noSpellslot: true,
        },
        overrides: {
          id: TerrifyingVisage.FRIGHTEN_ID,
          targetType: "creature",
          activationType: "action",
          noConsumeTargets: true,
          data: {
            save: {
              ability: ["wis"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            range: {
              units: "self",
            },
            target: {
              template: {
                type: "radius",
                size: "30",
                units: "ft",
                count: "",
                contiguous: false,
                width: "",
                height: "",
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
        name: "Terrifying Visage",
        options: {
          transfer: true,
          durationSeconds: 600,
          description: "While active you gain a benefit based on your Blood Ties choice: Fey - teleport 30 feet as a Bonus Action; Fiend - Resistance to Cold and Fire damage; Undead - use a Reaction to reduce non-Radiant damage taken by half your Sorcerer level.",
        },
        data: {
          _id: TerrifyingVisage.EFFECT_ID,
        },
      },
      {
        name: "Terrifying Visage",
        type: "enchant",
        activityMatch: "Adopt Visage",
        changes: toggleOffChanges("Drop Visage"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [TerrifyingVisage.FRIGHTEN_ID], effects: [TerrifyingVisage.EFFECT_ID] }),
          },
        },
      },
      {
        name: "Frightened",
        activityMatch: "Frighten",
        statuses: ["Frightened"],
        options: {
          expiry: "sourceEnd",
        },
      },
    ];
  }

}
