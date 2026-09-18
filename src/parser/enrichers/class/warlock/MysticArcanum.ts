import DDBEnricherData from "../../data/DDBEnricherData";
import type SpellListFactory from "../../../spells/SpellListFactory";

/**
 * Warlock levels 11/13/15/17: one chosen level 6-9 spell that can be cast once per Long Rest
 * without a spell slot. DDB attaches the chosen spell to the feature as a slot-less limited-use
 * spell entry; that copy is dropped by FEATURE_SPELLS_IGNORE and the feature carries a cast
 * activity for it instead, spending the feature's own use. The 2014 "(6th level)" and 2024
 * "(Level 6 Spell)" features share this enricher via DDBClassFeatureEnricher's name hints.
 *
 * With no spell chosen (a compendium munch, or a character yet to pick) the feature instead
 * carries the system's own shape: an ItemChoice restricted to the Warlock spell list at the
 * arcanum's spell level, granting the pick at will with its own once per Long Rest use. DDB's
 * Warlock spell endpoint stops at level 5 (the highest pact slot), so the munch also tops up the
 * Warlock spell list with the feature's level 6-9 choice options, which are spell definition ids.
 */
export default class MysticArcanum extends DDBEnricherData {

  /** Definition ids already sent to the spell list; the mule replays the class per subclass build. */
  static _listedSpellIds = new Set<number>();

  #choiceAdvancement: I5eAdvancement | null = null;

  /** DDB's slot-less limited-use copy of the chosen arcanum spell, when the payload carries one. */
  get arcanumSpell(): any | undefined {
    return this._getSpellsForFeature({ type: "class", name: this.ddbParser.originalName })[0];
  }

  get arcanumSpellName(): string | undefined {
    return this.arcanumSpell?.definition?.name;
  }

  /** The spell level this arcanum grants, read from "(Level 6 Spell)" or "(6th level)". */
  get arcanumLevel(): number | null {
    const name = this.ddbParser.originalName ?? this.name;
    const match = name.match(/Level (\d)/i) ?? name.match(/(\d)(?:st|nd|rd|th) level/i);
    return match ? parseInt(match[1]) : null;
  }

  /** DDB's "Choose a Spell" choice for this feature; type 4 choices pick spells. */
  get arcanumChoice(): IDDBChoiceEntry | undefined {
    const featureId = this.ddbParser.ddbDefinition?.id;
    return (this.ddbParser.ddbData?.character.choices.class ?? [])
      .find((choice) => choice.type === 4 && choice.componentId === featureId);
  }

  /** The spells on offer; each option id is a DDB spell definition id. */
  get arcanumOptions(): IDDBChoiceDefinitionOption[] {
    const choice = this.arcanumChoice;
    if (!choice) return [];
    const definition = (this.ddbParser.ddbData?.character.choices.choiceDefinitions ?? [])
      .find((def) => def.id === `${choice.componentTypeId}-${choice.type}`);
    return (definition?.options ?? []).filter((option) => choice.optionIds.includes(option.id));
  }

  override get type(): IDDBActivityType | null {
    return this.arcanumSpellName
      ? DDBEnricherData.ACTIVITY_TYPES.CAST
      : null;
  }

  override get activity(): IDDBActivityData | null {
    const spellName = this.arcanumSpellName;
    if (!spellName) return null;
    return {
      name: spellName,
      addSpellUuid: spellName,
      addItemConsume: true,
      noSpellslot: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get additionalAdvancements(): I5eAdvancement[] {
    // a chosen spell is already the cast activity, an unfilled choice beside it would be noise
    if (this.arcanumSpell) return [];
    const level = this.arcanumLevel;
    if (!level) return [];
    if (this.#choiceAdvancement) return [this.#choiceAdvancement];

    const definitionLevel = parseInt(String(foundry.utils.getProperty(this.ddbParser.ddbDefinition, "requiredLevel")));
    // the four arcana arrive at Warlock levels 11/13/15/17
    const choiceLevel = Number.isInteger(definitionLevel) ? definitionLevel : (level * 2) - 1;
    const choices: TI5eAdvItemChoiceConfigChoices = {
      [choiceLevel]: { count: 1, replacement: false },
    };
    // only the 2024 rules allow swapping an arcanum when gaining a Warlock level
    if (this.is2024) {
      for (let i = choiceLevel + 1; i <= 20; i++) {
        choices[i] = { count: null, replacement: true };
      }
    }

    this.#choiceAdvancement = DDBEnricherData.AdvancementBuilder.buildSpellChoice({
      name: this.ddbParser.originalName ?? this.name,
      hint: `Choose one level ${level} Warlock spell as this arcanum.`,
      choices,
      level,
      lists: ["class:warlock"],
      spell: {
        method: "atwill",
        uses: { max: "1", per: "lr", requireSlot: false },
      },
    });
    return [this.#choiceAdvancement];
  }

  override get override(): IDDBOverrideData {
    // the spell granted by the advancement carries its own use, so the feature needs no counter
    if (!this.arcanumSpell) return {};
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: this.ddbParser.originalName,
        max: "1",
        period: "lr",
      }),
    };
  }

  override async customFunction(_options: ICustomFunctionOptions) {
    if (!this.ddbParser.isMuncher || !game.user?.isGM) return;
    const options = this.arcanumOptions.filter((option) => !MysticArcanum._listedSpellIds.has(option.id));
    if (options.length === 0) return;

    // reached through the api global, as SpellListExtractor does, to keep barrels out of this file
    const spellListFactory = new (globalThis as any).DDBImporter.lib.SpellLists.SpellListFactory({ type: "class" }) as SpellListFactory;
    const added = await spellListFactory.addSpellsByDefinitionId("Warlock", options);
    // nothing resolving means the spells are not munched yet, a later pass should try again
    if (added === 0) return;
    options.forEach((option) => MysticArcanum._listedSpellIds.add(option.id));
  }

}
