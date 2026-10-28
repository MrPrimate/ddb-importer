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

  /** The four Dungeon Master's Guide artifact property tables, as `_ArtifactProperties` catalogues them. */
  type TArtifactPropertyTier = "minorBeneficial" | "majorBeneficial" | "minorDetrimental" | "majorDetrimental";

  /** A transfer effect carrying the passive half of an artifact property, or one DM's-choice toggle of it. */
  interface IArtifactPropertyRider {
    /** Distinguishes the DM's-choice toggles (skill, damage type, ability) in the compendium id. */
    variant?: string;
    label: string;
    description: string;
    changes: IActiveEffectChangeData[];
    midiChanges?: IActiveEffectChangeData[];
    ac5eChanges?: IAC5eActiveEffectChangeData[];
    statuses?: string[];
    /** Toggles ship disabled; the player enables the one the DM picked or the one that applies. */
    disabled?: boolean;
  }

  /** An activity an artifact property grants, before it is built into dnd5e activity data. */
  interface IArtifactPropertyActivity {
    name: string;
    type: "utility" | "heal" | "damage" | "save";
    activation: TActivationCost;
    condition?: string;
    /** Uses regained at dawn; absent for at-will activities. */
    uses?: number;
    /** Utility roll formula. */
    roll?: string;
    /** Heal or damage dice, e.g. 1d6 or 8d10. */
    formula?: string;
    damageType?: string;
    /** Save ability and fixed DC. */
    save?: { ability: string; dc: number };
    chatFlavor?: string;
  }

  interface IArtifactProperty {
    name: string;
    /** The Dungeon Master's Guide printing the row comes from. */
    rules: T5eRulesVersion;
    tier: TArtifactPropertyTier;
    /** Paraphrase of the rule; `ArtifactProperties.text` prefers the proxy-served printed text. */
    text: string;
    /** The rule opens with "While attuned", so the enchantment also requires attunement. */
    attuned?: boolean;
    /** Built on demand: roll-mode changes read `CONFIG.Dice`, which is not there when the table module loads. */
    riders?: () => IArtifactPropertyRider[];
    activities?: IArtifactPropertyActivity[];
  }

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
