/**
 * Advancement builders with no parser dependencies. AdvancementHelper pulls in the class parsers
 * (whose static SPECIAL_ADVANCEMENTS tables read AdvancementHelper while it is mid-evaluation), so
 * enrichers reach these through DDBEnricherData.AdvancementBuilder instead of importing
 * AdvancementHelper. This file is in DDBEnricherData's import closure: keep its imports leaf-only.
 *
 * `name` is the advancement's display title (dnd5e 5.x advancements carry `title`).
 */
export default class AdvancementBuilder {

  /**
   * A numeric scale value advancement from hand-written level entries, for pools DDB has no
   * levelScale for (the values come from the rules text). Built through the system class so the
   * data model supplies the remaining defaults.
   */
  static buildNumberScale({ name, identifier, scale, hint }: {
    name: string;
    identifier: string;
    scale: Record<string, number>;
    hint?: string;
  }): I5eAdvancement {
    const adv = new game.dnd5e.documents.advancement.ScaleValueAdvancement();
    const update = {
      configuration: {
        identifier,
        type: "number",
        scale: {} as Record<string, I5eAdvScaleValueNumericEntry>,
      },
      title: name,
      ...(hint ? { hint } : {}),
    };
    for (const [level, value] of Object.entries(scale)) {
      update.configuration.scale[level] = { value };
    }
    adv.updateSource(update as any);
    return adv.toObject() as unknown as I5eAdvancement;
  }

  /** The dice-typed twin of buildNumberScale; each level entry is the die count and faces. */
  static buildDiceScale({ name, identifier, scale, hint }: {
    name: string;
    identifier: string;
    scale: Record<string, { number: number; faces: number }>;
    hint?: string;
  }): I5eAdvancement {
    const adv = new game.dnd5e.documents.advancement.ScaleValueAdvancement();
    const update = {
      configuration: {
        identifier,
        type: "dice",
        scale: {} as Record<string, I5eAdvScaleValueDiceEntry>,
      },
      title: name,
      ...(hint ? { hint } : {}),
    };
    for (const [level, die] of Object.entries(scale)) {
      update.configuration.scale[level] = { number: die.number, faces: die.faces };
    }
    adv.updateSource(update as any);
    return adv.toObject() as unknown as I5eAdvancement;
  }

  /**
   * An ItemChoice advancement picking spells by spell list and level rather than from a fixed
   * pool, the shape the system uses for Mystic Arcanum and Magic Initiate. `choices` is keyed by
   * the character or class level the pick happens at.
   */
  static buildSpellChoice({ name, hint, choices, level, lists = [], spell }: {
    name: string;
    hint?: string;
    choices: Record<string, { count: number | null; replacement: boolean }>;
    level: number | string;
    lists?: string[];
    spell: {
      ability?: string[];
      method: string;
      prepared?: number;
      uses?: { max: string; per: string; requireSlot: boolean };
    };
  }): I5eAdvancement {
    const adv = new game.dnd5e.documents.advancement.ItemChoiceAdvancement();
    const update = {
      title: name,
      ...(hint ? { hint } : {}),
      configuration: {
        allowDrops: true,
        pool: [],
        choices,
        restriction: {
          level: String(level),
          list: lists,
        },
        type: "spell",
        spell: {
          ability: spell.ability ?? [],
          method: spell.method,
          prepared: spell.prepared ?? 0,
          uses: spell.uses ?? { max: "", per: "", requireSlot: false },
        },
      },
    };
    adv.updateSource(update as any);
    return adv.toObject() as unknown as I5eAdvancement;
  }

}
