import DDBDataUtils from "../../../lib/DDBDataUtils";
import DDBEnricherData from "../../data/DDBEnricherData";

/** A spell the wizard picked for the feature, as far as the character payload tells us. */
export interface IMasteredSpell {
  name: string;
  /** Spell level, when the class spell list carries the spell; the cast then pins that level. */
  level: number | null;
  /** DDB's spent count for the feature's copy of the spell, when it tracks one. */
  spent: number;
}

/**
 * Shared shape for Spell Mastery and Signature Spells: the wizard picks spells from the
 * spellbook and gains a free cast of each at its base level. DDB moves each pick off the wizard's
 * spell list onto the feature as a slot-less class spell marked `baseLevelAtWill` (Spell Mastery)
 * or `atWillLimitedUseLevel` with a 1/SR limited use (Signature Spells), and records the pick as
 * a "Choose a Spell" choice on the feature; both are read. Each pick becomes a cast activity on
 * the feature, the first as the main activity. The spell factory parses the same entry as the
 * always-prepared spellbook spell with slot casting for higher levels
 * (CharacterSpellFactory.asMasteredSpellbookSpell). With no pick made (compendium imports,
 * unchosen features) the feature keeps its defaults.
 */
export default abstract class _MasteredSpells extends DDBEnricherData {

  abstract get featureName(): string;

  /** DDB's per-spell marker for this feature on the class spell list. */
  abstract isMarked(spell: IDDBSpellEntry): boolean;

  get classSpells(): IDDBSpellEntry[] {
    return this.ddbParser?.ddbData?.character?.spells?.class ?? [];
  }

  get masteredSpells(): IMasteredSpell[] {
    const spells: IMasteredSpell[] = [];
    const add = (name: string, entry: IDDBSpellEntry | undefined) => {
      if (spells.some((s) => s.name === name)) return;
      spells.push({
        name,
        level: entry?.definition?.level ?? null,
        spent: entry?.limitedUse?.numberUsed ?? 0,
      });
    };

    for (const spell of this.classSpells) {
      if (spell.definition && this.isMarked(spell)) add(spell.definition.name, spell);
    }

    const ddb = this.ddbParser?.ddbData;
    const feat = this.ddbParser?.ddbFeature;
    if (ddb && feat) {
      const choices = DDBDataUtils.getChoices({ ddb, type: "class", feat, selectionOnly: true });
      for (const choice of choices) {
        if (!choice.label) continue;
        add(choice.label, this.classSpells.find((s) => s.definition?.name === choice.label));
      }
    }

    return spells;
  }

  /** The cast activity for one pick; subclasses add consumption where the cast is limited. */
  castHint(spell: IMasteredSpell): IDDBActivityData {
    return {
      name: spell.name,
      addSpellUuid: spell.name,
      noSpellslot: true,
      data: {
        spell: {
          spellbook: true,
          ...(spell.level !== null ? { level: spell.level } : {}),
        },
      },
    };
  }

  override get noChoiceBuild(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return this.masteredSpells.length > 0 ? DDBEnricherData.ACTIVITY_TYPES.CAST : null;
  }

  override get activity(): IDDBActivityData | null {
    const [first] = this.masteredSpells;
    return first ? this.castHint(first) : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.masteredSpells.slice(1).map((spell) => ({
      init: {
        name: spell.name,
        type: DDBEnricherData.ACTIVITY_TYPES.CAST,
      },
      build: {
        generateSpell: true,
        generateConsumption: false,
      },
      overrides: this.castHint(spell),
    }));
  }

}
