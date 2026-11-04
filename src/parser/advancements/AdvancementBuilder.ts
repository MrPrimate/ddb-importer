import logger from "../../lib/Logger";
import AdvancementWrapper from "./AdvancementWrapper";

/**
 * Advancement builders with no parser dependencies. AdvancementHelper pulls in the class parsers
 * (whose static SPECIAL_ADVANCEMENTS tables read AdvancementHelper while it is mid-evaluation), so
 * enrichers reach these through DDBEnricherData.AdvancementBuilder instead of importing
 * AdvancementHelper. This file is in DDBEnricherData's import closure: keep its imports leaf-only.
 */
export default class AdvancementBuilder {

  /**
   * A plain-data advancement built from the system class's defaults. It is an AdvancementWrapper,
   * not an instance of the class: `updateSource` merges plain data and `toObject` returns it.
   */
  static createAdvancement(AdvancementClass: new (data?: any) => any): AdvancementWrapper {
    try {
      return new AdvancementWrapper(AdvancementClass);
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
   * data model supplies the remaining defaults. `usage` builds the dnd5e "usage" type, a use count
   * whose first level carries the recovery period (shown as "2/SR").
   */
  static buildNumberScale({ name, identifier, scale, hint, usage }: {
    name: string;
    identifier: string;
    scale: Record<string, number>;
    hint?: string;
    usage?: { period?: TLimitedUsePeriod | "" };
  }): I5eAdvancement {
    const adv = AdvancementBuilder.createAdvancement(game.dnd5e.documents.advancement.ScaleValueAdvancement);
    const update = {
      configuration: {
        identifier,
        type: usage ? "usage" : "number",
        scale: {} as Record<string, I5eAdvScaleValueNumericEntry>,
      },
      name,
      ...(hint ? { hint } : {}),
    };
    for (const [level, value] of Object.entries(scale)) {
      update.configuration.scale[level] = { value };
    }
    if (usage?.period) AdvancementBuilder.setUsagePeriod(update.configuration.scale, usage.period);
    adv.updateSource(update);
    return adv.toObject() as unknown as I5eAdvancement;
  }

  /** Puts the recovery period on the lowest level entry of a usage scale; later levels inherit it. */
  static setUsagePeriod(scale: Record<string, I5eAdvScaleValueNumericEntry>, period: string) {
    const first = Object.keys(scale).map(Number).sort((a, b) => a - b)[0];
    if (first !== undefined) scale[first] = { ...scale[first], period };
  }

  /**
   * Turns a number scale into the dnd5e "usage" type in place. The usage schema stores whole,
   * non-negative counts only, so any other scale is left as it is.
   */
  static toUsageScale(advancement: I5eAdvancement, period: TLimitedUsePeriod | "" = ""): I5eAdvancement {
    if (advancement.type !== "ScaleValue") return advancement;
    const configuration = (advancement as I5eAdvancementScaleValue).configuration;
    if (!configuration || configuration.type !== "number" || !configuration.scale) return advancement;
    const entries = Object.values(configuration.scale) as I5eAdvScaleValueNumericEntry[];
    if (!entries.every((e) => Number.isInteger(Number(e.value)) && Number(e.value) >= 0 && `${e.value}` !== "")) return advancement;
    configuration.type = "usage";
    if (period) AdvancementBuilder.setUsagePeriod(configuration.scale as Record<string, I5eAdvScaleValueNumericEntry>, period);
    return advancement;
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
    adv.updateSource(update);
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
    adv.updateSource(update);
    return adv.toObject() as unknown as I5eAdvancement;
  }

}
