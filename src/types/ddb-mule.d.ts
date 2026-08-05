// ---------------------------------------------------------------------------
// DDB Mule Proxy Interfaces
// Models the JSON returned by the DDB proxy API for the mule list endpoints.
// See DDBMuleHandler.getList / getSubclasses / getSubclassesCached.
// ---------------------------------------------------------------------------

export {};

global {

  /** Envelope shared by the /proxy/* mule list endpoints. */
  export interface IDDBMuleResponse<T> {
    success: boolean;
    message: string;
    data: T;
  }

  // ---- Shared leaf overrides ------------------------------------------------

  /**
   * spellRules as returned by the mule endpoints. levelPreparedSpellMaxes is
   * sparse: the prepared casters (Cleric, Druid, Paladin, Wizard) return null
   * for every level past the first, where IDDBSpellRules declares number[].
   */
  export interface IDDBMuleSpellRules extends Omit<IDDBSpellRules, "levelPreparedSpellMaxes"> {
    levelPreparedSpellMaxes: (number | null)[];
  }

  /** wealthDice as returned by the mule endpoints; diceMultiplier is nullable. */
  export interface IDDBMuleWealthDice extends Omit<IDDBWealthDice, "diceMultiplier"> {
    diceMultiplier: number | null;
  }

  /**
   * Fields common to both mule class-definition endpoints. These are the
   * places the payload disagrees with IDDBClassDefinition rather than merely
   * narrowing it:
   * - sources and isHomebrew are always present
   * - sourcePageNumber is a number, not the string IDDBSourcesDefinition declares
   */
  export interface IDDBMuleClassDefinitionBase {
    sources: IDDBSource[];
    isHomebrew: boolean;
    sourcePageNumber: number | null;
  }

  /** Keys overridden on every mule class definition. */
  type TDDBMuleClassOverrides = keyof IDDBMuleClassDefinitionBase | "spellRules" | "wealthDice";

  // ---- /proxy/classes -------------------------------------------------------

  /**
   * A base class returned by /proxy/classes. Same class-definition payload DDB
   * nests on a character's class, so most fields come straight from
   * IDDBClassDefinition; only the card and spellcasting fields are reliably
   * populated here in a way a subclass's are not.
   *
   * parentClassId is always null: this endpoint returns base classes only.
   * Subclasses come from /proxy/subclass, see IDDBMuleSubclassDefinition.
   */
  export interface IDDBMuleClassDefinition
    extends Omit<IDDBClassDefinition, TDDBMuleClassOverrides>, IDDBMuleClassDefinitionBase {
    parentClassId: null;
    spellRules: IDDBMuleSpellRules;
    wealthDice: IDDBMuleWealthDice | null;
    color: IDDBClassColor;
    prerequisites: IDDBFeatPrerequisite[];
  }

  export type IDDBMuleClassesResponse = IDDBMuleResponse<IDDBMuleClassDefinition[]>;


  // ---- /proxy/races ---------------------------------------------------------

  /**
   * A species (race) returned by /proxy/races. The proxy returns the same
   * race payload DDB nests on a character (IDDBRace: entityRaceId, fullName,
   * baseName, sources, isHomebrew, etc.), with racial traits pruned. Selection
   * is keyed on entityRaceId, which is what speciesMule filters on.
   */
  export type IDDBMuleSpeciesDefinition = IDDBRace;

  export type IDDBMuleRacesResponse = IDDBMuleResponse<IDDBMuleSpeciesDefinition[]>;

  // ---- /proxy/feats and /proxy/backgrounds ----------------------------------

  /**
   * A feat returned by /proxy/feats. The catalog entries are flat: featMule
   * filters on the top level id, which is also what the imported document
   * carries as flags.ddbimporter.id.
   */
  export interface IDDBMuleFeatDefinition {
    id: number;
    name: string;
    sources: IDDBSource[];
    isHomebrew: boolean;
  }

  /** A background returned by /proxy/backgrounds; same flat shape as a feat. */
  export type IDDBMuleBackgroundDefinition = IDDBMuleFeatDefinition;

  type TDDBMuleGetList = IDDBMuleClassDefinition | IDDBMuleSpeciesDefinition | IDDBMuleFeatDefinition;

  // ---- /proxy/subclass ------------------------------------------------------

  /**
   * classFeatures entry on a subclass definition. Same shape as the class
   * feature summaries embedded in a character's class definition, except
   * displayOrder is nullable here.
   */
  export interface IDDBMuleSubclassFeature extends Omit<IDDBClassDefinitionFeature, "displayOrder"> {
    displayOrder: number | null;
  }

  /**
   * A single subclass returned by /proxy/subclass. This is a class definition:
   * the same payload DDB nests as `subclassDefinition` on a character's class,
   * so it carries the full set of class fields even though most of the
   * card and spellcasting ones are null on a subclass.
   *
   * parentClassId is always populated: every entry is a subclass.
   */
  export interface IDDBMuleSubclassDefinition
    extends Omit<IDDBClassDefinition, TDDBMuleClassOverrides | "classFeatures" | "parentClassId">,
    IDDBMuleClassDefinitionBase {
    parentClassId: number;
    classFeatures: IDDBMuleSubclassFeature[];
    spellRules: IDDBMuleSpellRules | null;
    wealthDice: IDDBMuleWealthDice | null;
  }

  export type IDDBMuleSubclassesResponse = IDDBMuleResponse<IDDBMuleSubclassDefinition[]>;

}
