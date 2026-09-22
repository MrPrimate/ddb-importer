/** Import-time icon policy for effects whose presence is controlled by an area or aura. */
export default class EffectPresentation {

  /**
   * Run after activity/effect linking, including enricher cleanup. Permanent area effects are
   * not temporary in Foundry, so CONDITIONAL hides them even while a recipient is inside.
   * Mark only local effects; referenced system/third-party compendium documents are not edited.
   */
  static applyIconVisibility(document: TAll5eItemDocuments, { paladinAura = false } = {}): void {
    const standalone = document.flags?.ddbimporter?.standaloneEffects ?? [];
    const effects = [...(document.effects ?? []), ...standalone];
    if (!effects.length) return;
    const activities = document.system && "activities" in document.system
      ? Object.values(document.system.activities ?? {})
      : [];
    const visible = new Set<I5eEffectData>();
    const markReference = (reference: string) => {
      for (const effect of effects) {
        if (effect.name === reference || effect._id === reference || (effect._id && reference.endsWith(`.ActiveEffect.${effect._id}`))) {
          visible.add(effect);
        }
      }
    };
    const markActivity = (activity: I5eActivity) => {
      for (const link of activity.effects ?? []) {
        if (link._id) markReference(link._id);
        for (const rider of link.riders?.effect ?? []) markReference(rider);
      }
    };

    for (const activity of activities) {
      if (activity.target?.template?.type) markActivity(activity);
      for (const behavior of activity.behaviors ?? []) {
        if (behavior.type === "applyActiveEffect") {
          const config = behavior.config as I5eActivityBehaviorApplyEffectConfig;
          for (const reference of config.effects ?? []) markReference(reference);
        } else if (behavior.type === "ddbMacro") {
          const config = behavior.config as I5eActivityBehaviorMacroConfig;
          if (config.function && config.function !== "useActivity") continue;
          const args = config.args ?? {};
          const choices = args.activityChoices ?? config.activityChoices;
          const id = config.activity || args.activityId;
          const names = [...(id ? [] : [args.activityName]), ...(Array.isArray(choices) ? choices : [])]
            .filter((name): name is string => typeof name === "string" && name.length > 0);
          if (!id && !names.length) markActivity(activity);
          else {
            // Every variant needs its icon: deleting one sibling can make another the runtime fallback.
            for (const sibling of activities) {
              if ((id && sibling._id === id) || names.some((name) => sibling.name?.startsWith(name))) markActivity(sibling);
            }
          }
        }
      }
    }

    for (const effect of effects) {
      const moduleAura = (effect.type as string | undefined) === "auraeffects.aura"
        || effect.system?.changes?.some((change) => change.key.startsWith("flags.automated-conditions-5e.aura."));
      // Paladin auras also carry self effects and module-driven arms without a placing activity.
      if (paladinAura || moduleAura || visible.has(effect)) effect.showIcon = 2;
    }
  }

}
