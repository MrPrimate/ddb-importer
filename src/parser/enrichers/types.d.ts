import type DDBBackgroundEnricher from "./DDBBackgroundEnricher";
import type DDBClassFeatureEnricher from "./DDBClassFeatureEnricher";
import type DDBFeatEnricher from "./DDBFeatEnricher";
import type DDBGenericEnricher from "./DDBGenericEnricher";
import type DDBItemEnricher from "./DDBItemEnricher";
import type DDBMonsterFeatureEnricher from "./DDBMonsterFeatureEnricher";
import type DDBSpeciesTraitEnricher from "./DDBSpeciesTraitEnricher";
import type DDBSpellEnricher from "./DDBSpellEnricher";

export {};

global {

  type TDDBEnricher = DDBGenericEnricher
    | DDBBackgroundEnricher
    | DDBClassFeatureEnricher
    | DDBMonsterFeatureEnricher
    | DDBFeatEnricher
    | DDBItemEnricher
    | DDBSpeciesTraitEnricher
    | DDBSpellEnricher;

  /** An evolved magic item property (Arcana Unleashed), as `_EvolvedItemProperties` catalogues it. */
  type TEvolvedTier = "rare" | "veryRare" | "legendary";

  interface IEvolvedSpell {
    name: string;
    /** Fixed save DC printed with the property; the item is not a spellcaster. */
    dc?: number;
    /** Fixed spell attack bonus (Withering only). */
    attack?: number;
    /** Extra activity description, e.g. Mind Blank's self-only restriction. */
    note?: string;
  }

  interface IEvolvedUse {
    /** Activity name, e.g. "Studious: Add 1d6". */
    name: string;
    max: number;
    activation: TActivationCost;
    condition?: string;
    /** Utility roll formula (Amicable / Studious). */
    roll?: string;
    /** Duration of the effect the activity applies (Quickening / Vanishing). */
    durationSeconds?: number;
    concentration?: boolean;
  }

  interface IEvolvedProperty {
    name: string;
    tier: TEvolvedTier;
    /** Paraphrase of the rule; `EvolvedItemProperties.text` prefers the proxy-served printed text. */
    text: string;
    /** Property text opens with "While attuned", so the enchantment also requires attunement. */
    attuned?: boolean;
    /** One cast activity per spell, each with its own daily use. */
    spells?: IEvolvedSpell[];
    /** The spells are cast together with one Magic action and share the single daily use (Restorative). */
    sharedSpellUse?: boolean;
    /** A limited-use utility activity. */
    use?: IEvolvedUse;
  }

  /** A rider activity in raw dnd5e shape, before the enricher or host item wraps it. */
  interface IEvolvedRawActivity {
    id: string;
    name: string;
    type: "cast" | "utility";
    /** Spell name of a cast activity; the caller resolves it to a compendium uuid. */
    spell?: string;
    data: Partial<I5eActivity>;
  }

  /** Which optional module channels to emit on hand-built effects. */
  interface IEvolvedModules {
    ac5e?: boolean;
    midi?: boolean;
  }

  /** A spell the wizard picked for the feature, as far as the character payload tells us. */
  interface IMasteredSpell {
    name: string;
    /** Spell level, when the class spell list carries the spell; the cast then pins that level. */
    level: number | null;
    /** DDB's spent count for the feature's copy of the spell, when it tracks one. */
    spent: number;
  }
}
