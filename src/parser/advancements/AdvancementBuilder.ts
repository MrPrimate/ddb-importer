import logger from "../../lib/Logger";
import AdvancementWrapper from "./AdvancementWrapper";

/**
 * Advancement builders with no parser dependencies. AdvancementHelper pulls in the class parsers
 * (whose static SPECIAL_ADVANCEMENTS tables read AdvancementHelper while it is mid-evaluation), so
 * enrichers reach these through DDBEnricherData.AdvancementBuilder instead of importing
 * AdvancementHelper. This file is in DDBEnricherData's import closure: keep its imports leaf-only.
 */
export default class AdvancementBuilder {

  static createAdvancement<T>(AdvancementClass: new () => T): T & { _id: string } {
    try {
      return new AdvancementWrapper(AdvancementClass) as unknown as T & { _id: string; updateSource: (data: Record<string, unknown>) => void };
    } catch (error) {
      logger.error("Error creating advancement:", {
        AdvancementClass,
        error,
      });
      throw error;
    }
  }

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
    const adv = AdvancementBuilder.createAdvancement(game.dnd5e.documents.advancement.ScaleValueAdvancement);
    const update = {
      configuration: {
        identifier,
        type: "number",
        scale: {} as Record<string, I5eAdvScaleValueNumericEntry>,
      },
      name,
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
    const adv = AdvancementBuilder.createAdvancement(game.dnd5e.documents.advancement.ScaleValueAdvancement);
    const update = {
      configuration: {
        identifier,
        type: "dice",
        scale: {} as Record<string, I5eAdvScaleValueDiceEntry>,
      },
      name,
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
    choices: TI5eAdvItemChoiceConfigChoices;
    level: number | string;
    lists?: string[];
    spell: {
      ability?: string[];
      method: string;
      prepared?: number;
      uses?: { max: string; per: string; requireSlot: boolean };
    };
  }): I5eAdvancement {
    const adv = AdvancementBuilder.createAdvancement(game.dnd5e.documents.advancement.ItemChoiceAdvancement);
    const update = {
      name,
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
