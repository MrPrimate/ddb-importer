import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Origami Mage: DDB builds every familiar command as a 15-foot save. Only Last Resort is one (one
 * creature, Dexterity against your spell save DC, Blinded for a minute); the rest are commands.
 */
export default class OrigamiFamiliar extends DDBEnricherData {

  static command(name: string, condition: string, type: TActivationCost = "action"): IDDBAdditionalActivity {
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
      build: {
        generateConsumption: false,
        generateTarget: true,
        generateActivation: true,
        activationOverride: { type, value: 1, condition },
      },
      overrides: { targetType: "creature", noConsumeTargets: true, noTemplate: true },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Last Resort",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      activationCondition: "Your origami familiar dives at a creature (the familiar is destroyed when the effect ends)",
      noTemplate: true,
      data: {
        range: { override: true, value: "5", units: "ft" },
        save: { ability: ["dex"], dc: { calculation: "spellcasting", formula: "" } },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      OrigamiFamiliar.command("Camouflage", "Command your familiar to flatten into a paper form (Investigation check against your spell save DC to discern it)", "special"),
      OrigamiFamiliar.command("Revert Camouflage", "The familiar shifts back into its origami form"),
      OrigamiFamiliar.command("Reconnaissance", "The familiar listens for 1 minute within 15 feet, then returns with a transcript"),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Last Resort",
        activityMatch: "Last Resort",
        statuses: ["blinded"],
        options: {
          durationSeconds: 60,
          description: "Blinded by the unfurled paper. The target, or a creature that can touch it, can take an action to make a Strength check against the spell save DC, ending the effect on a success.",
        },
      },
    ];
  }

}
