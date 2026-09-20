import { logger } from "../../../../lib/_module";

export default class Vestige {

  static VESTIGE_POWER_IDENTIFIER = "vestige-power";

  static VESTIGE_COMPANION_IDENTIFIER = "vestige-companion";

  /**
   * Summoned vestige actors are named "Vestige Companion (Celestial)" etc, which dnd5e formats to
   * identifiers such as `vestige-companion-celestial`. Actor5e's `identifier` getter is missing from
   * the dnd5e types, so the name is formatted directly; actors carry no `system.identifier` override.
   */
  static VESTIGE_SUMMON_IDENTIFIERS = [
    "vestige-companion-celestial",
    "vestige-companion-fiend",
    "vestige-companion-undead",
  ];

  // The stat block action is "Divine Power (1/Day)", so allow for a suffix surviving the parse.
  static DIVINE_POWER_IDENTIFIER = "divine-power";

  /**
   * Vestige Power lets the vestige regain Divine Power when the warlock finishes a Short or Long Rest.
   * Finds any tracked vestige summons for the actor and resets the Divine Power uses on each.
   */
  /** The dnd5e identifier for a name; older systems have no `formatIdentifier`, which slugifies strictly. */
  static identifierFor(name: string): string {
    const format = (dnd5e.utils as any).formatIdentifier as ((value: string) => string) | undefined;
    return format ? format(name) : name.slugify({ strict: true });
  }

  static async recoverDivinePower(actor: any) {
    const hasVestigePower = actor.items.some((i) => i.identifier === Vestige.VESTIGE_POWER_IDENTIFIER);
    const hasVestigeCompanion = actor.items.some((i) => i.identifier === Vestige.VESTIGE_COMPANION_IDENTIFIER);
    if (!hasVestigePower || !hasVestigeCompanion) return;

    const vestiges: any[] = (dnd5e.registry.summons.creatures(actor) as any[])
      .filter((summon) =>
        !!summon && Vestige.VESTIGE_SUMMON_IDENTIFIERS.includes(Vestige.identifierFor(summon.name)),
      );

    for (const vestige of vestiges) {
      const updates = vestige.items
        .filter((i) => (i.identifier ?? "").startsWith(Vestige.DIVINE_POWER_IDENTIFIER))
        .filter((i) => (foundry.utils.getProperty(i, "system.uses.spent") as number | undefined ?? 0) > 0)
        .map((i) => ({ _id: i.id, "system.uses.spent": 0 }));
      if (updates.length === 0) continue;

      logger.debug(`Recovering Divine Power for ${vestige.name}`, { actor, vestige, updates });
      await vestige.updateEmbeddedDocuments("Item", updates);
    }
  }
}
