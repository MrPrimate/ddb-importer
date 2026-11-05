import DDBDataUtils from "../../../lib/DDBDataUtils";
import DDBEnricherData from "../../data/DDBEnricherData";


/**
 * Shared shape for Spell Mastery and Signature Spells: the wizard picks spells from the
 * spellbook and gains a free cast of each at its base level. DDB moves each pick off the wizard's
 * spell list onto the feature as a slot-less class spell marked `baseLevelAtWill` (Spell Mastery)
 * or `atWillLimitedUseLevel` with a 1/SR limited use (Signature Spells), and records the pick as
 * a "Choose a Spell" choice on the feature; both are read. Each pick becomes a cast activity on
 * the feature, the first as the main activity. The spell factory parses the same entry as the
 * always-prepared spellbook spell with slot casting for higher levels
 * (CharacterSpellFactory.asMasteredSpellbookSpell). With no pick known (munched copies, which
 * build characters in Foundry, and unchosen features) the feature takes the official SRD shape
 * instead: an enchant activity that marks a spell from the spellbook.
 */
export default abstract class _MasteredSpells extends DDBEnricherData {

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

  /** The enchant activity, effect name and name suffix for marking a spell without a known pick. */
  abstract get mark(): { activity: string; effect: string; suffix: string };

  /** Whether the marked spell is always prepared. */
  get markPrepares(): boolean {
    return true;
  }

  /** Activities beside the enchant when no pick is known. */
  get markActivities(): IDDBAdditionalActivity[] {
    return [];
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
    return this.masteredSpells.length > 0
      ? DDBEnricherData.ACTIVITY_TYPES.CAST
      : DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData | null {
    const [first] = this.masteredSpells;
    if (first) return this.castHint(first);
    return {
      name: this.mark.activity,
      targetType: "self",
      noConsumeTargets: true,
      data: {
        restrictions: {
          type: "spell",
          allowMagical: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.masteredSpells.length > 0) return [];
    return [
      {
        name: this.mark.effect,
        type: "enchant",
        activityMatch: this.mark.activity,
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} (${this.mark.suffix})`, 20, "name"),
          ...(this.markPrepares
            ? [DDBEnricherData.ChangeHelper.overrideChange("2", 20, "system.prepared")]
            : []),
        ],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.masteredSpells.length === 0) return this.markActivities;
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
