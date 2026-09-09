import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * "You have advantage on saving throws against a condition associated with your
 * Floral Legacy". DDB models the six legacies as options on one trait and the
 * effect is generated during the parent build
 */
export default class FloralFortitude extends DDBEnricherData {

  static LEGACY_CONDITIONS: Record<string, string> = {
    "Guardian": "frightened",
    "Healer": "exhaustion",
    "Poisoner": "poisoned",
    "Waterplant": "restrained",
    "Wildflower": "charmed",
    // Beauty's condition is "Magical sleep", which is not a dnd5e condition
  };

  get legacy(): string | null {
    const labels = (this.ddbParser._chosen ?? []).map((choice) => choice.label ?? "");
    return Object.keys(FloralFortitude.LEGACY_CONDITIONS)
      .find((name) => labels.some((label) => label.includes(name))) ?? null;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    const legacy = this.legacy;
    if (!legacy) {
      return [
        {
          name: "Floral Fortitude",
          options: {
            transfer: true,
            description: "You have Advantage on saving throws against magical sleep.",
          },
        },
      ];
    }
    const condition = FloralFortitude.LEGACY_CONDITIONS[legacy];
    return [
      {
        name: `Floral Fortitude: ${legacy}`,
        options: {
          transfer: true,
          description: `You have Advantage on saving throws against the ${condition} condition.`,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            `riderStatuses.${condition}`,
            20,
            "flags.automated-conditions-5e.save.advantage",
          ),
        ],
      },
    ];
  }

}
