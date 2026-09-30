import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Vestige Patron (AU 2024). A companion feature (companions.ts): the primary activity is the
 * summon, whose profile is the actor parsed from the chosen option's stat block. The option child
 * keeps the feature name (KEEP_CHOICE_FEATURE_NAME) so it parses that block itself and its summon
 * folds into this document via mergeChoiceActivities; DDB's per-form actions ride along and the
 * bonus-action command sits beside them.
 */
export default class VestigeCompanion extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Summon Vestige",
      activationType: "action",
      targetType: "self",
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        creatureSizes: ["sm"],
        // the summoner's Charisma modifier on Vestige's Strike and on Healing Touch (the Celestial
        // form's Divine Power)
        bonuses: {
          attackDamage: "@abilities.cha.mod",
          healing: "@abilities.cha.mod",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Command Vestige",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        overrides: {
          activationType: "bonus",
          noConsumeTargets: true,
        },
      },
    ];
  }

  /**
   * A loaded enricher drops DDB's action matching unless it opts back in; the vestige's strike,
   * HP tracker and Divine Power option hang off the chosen option and vary by type, so match
   * them rather than list them.
   */
  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get mergeChoiceActivities(): boolean {
    return true;
  }

  /** DDB's limited use here is its tracker for the vestige's HP, not a use of the feature. */
  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "",
        recovery: [],
      },
    };
  }

  /**
   * DDB's per-form HP tracker action ("Celestial Vestige Companion HP") is dropped; the summoned
   * actor tracks its own HP. The per-form Divine Power action (1/Day) would spend the feature's
   * uses, which are that tracker's, so it gets a once-per-long-rest use of its own. Runs again on
   * the parent once the chosen form's actions are merged in (DDBChoiceFeature). The stat block's
   * Hit Dice and match data come from the companion parse, which rewrites the summon at import.
   */
  override async cleanup(): Promise<void> {
    const activities = this.data?.system?.activities as Record<string, I5eActivity> | undefined;
    if (!activities) return;

    for (const [id, activity] of Object.entries(activities)) {
      if (activity.type === "utility" && (/ Vestige Companion HP$/).test(activity.name ?? "")) {
        delete activities[id];
        continue;
      }
      if (!activity.name?.startsWith("Divine Power:") || !activity.consumption) continue;
      const targets = (activity.consumption.targets ?? [])
        .filter((target) => !(target.type === "itemUses" && !target.target));
      if (!targets.some((target) => target.type === "activityUses")) {
        targets.push({ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } });
      }
      activity.consumption.targets = targets;
      activity.uses = { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] };
    }
  }

}
