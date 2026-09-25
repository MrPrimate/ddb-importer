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
  static async recoverDivinePower(actor: Actor.Implementation) {
    // dnd5e-types 5.0 does not declare Item5e#identifier or dnd5e.utils.formatIdentifier; both exist in 5.3
    const identifierOf = (item: Item.Implementation) => (item as unknown as { identifier: string }).identifier ?? "";
    const formatIdentifier = (dnd5e.utils as unknown as { formatIdentifier: (input: string) => string }).formatIdentifier;
    const hasVestigePower = actor.items.some((i: Item.Implementation) => identifierOf(i) === Vestige.VESTIGE_POWER_IDENTIFIER);
    const hasVestigeCompanion = actor.items.some((i: Item.Implementation) => identifierOf(i) === Vestige.VESTIGE_COMPANION_IDENTIFIER);
    if (!hasVestigePower || !hasVestigeCompanion) return;

    const vestiges = dnd5e.registry.summons.creatures(actor)
      .filter((summon): summon is Actor.Implementation =>
        !!summon && Vestige.VESTIGE_SUMMON_IDENTIFIERS.includes(formatIdentifier(summon.name)),
      );

    for (const vestige of vestiges) {
      const updates = vestige.items
        .filter((i: Item.Implementation) => identifierOf(i).startsWith(Vestige.DIVINE_POWER_IDENTIFIER))
        .filter((i: Item.Implementation) => (foundry.utils.getProperty(i, "system.uses.spent") as number | undefined ?? 0) > 0)
        .map((i: Item.Implementation) => ({ _id: i.id, "system.uses.spent": 0 }));
      if (updates.length === 0) continue;

      logger.debug(`Recovering Divine Power for ${vestige.name}`, { actor, vestige, updates });
      await vestige.updateEmbeddedDocuments("Item", updates);
    }
  }
}
