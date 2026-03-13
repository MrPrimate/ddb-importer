// ---------------------------------------------------------------------------
// DDB Monster Source Interfaces
// Models the JSON returned by the DDB proxy API for monsters.
// Derived from 3,114 monster entries in diff/monsters.json.
// ---------------------------------------------------------------------------

export {};

global {

  type TDDBMonsterActionType = "action" | "reaction" | "bonus" | "mythic" | "lair" | "legendary" | "special" | "villain";

  // ---- Sub-structures -------------------------------------------------------

  export interface IDDBMonsterHitPointDice {
    diceCount: number;
    diceMultiplier: number;
    diceString: string;
    diceValue: number;
    fixedValue: number;
  }

  export interface IDDBMonsterMovement {
    movementId: number;
    speed: number;
    notes: string | null;
  }

  export interface IDDBMonsterSavingThrow {
    statId: number;
    bonusModifier: number | null;
  }

  export interface IDDBMonsterSense {
    senseId: number;
    notes: string;
  }

  export interface IDDBMonsterSkill {
    skillId: number;
    value: number;
    additionalBonus: number | null;
  }

  export interface IDDBMonsterStat {
    statId: number;
    name: string | null;
    value: number;
  }

  export interface IDDBMonsterLanguage {
    languageId: number;
    notes: string;
  }

  export interface IDDBMonsterSwarm {
    name: string;
    sizeId: number;
    typeId: number;
  }

  // ---- Monster source data --------------------------------------------------

  /** A single monster entry from the DDB proxy API. */
  export interface IDDBMonsterSourceData extends IDDBSourcesDefinition {
    // Identification
    id: number;
    entityTypeId: number;
    name: string;
    url: string;

    // Publishing / metadata
    homebrewStatus: number;
    isReleased: boolean;
    isLegacy: boolean;
    isLegendary: boolean;
    isMythic: boolean;
    hideCr: boolean;
    collectionUserId: number;
    version: string | null;

    // Type & physical characteristics
    typeId: number;
    subTypes: number[];
    sizeId: number;
    alignmentId: number | null;
    swarm: IDDBMonsterSwarm | null;
    tags: string[];
    environments: number[];

    // Images
    avatarUrl: string;
    basicAvatarUrl: string | null;
    largeAvatarUrl: string | null;

    // Combat statistics
    armorClass: number;
    armorClassDescription: string;
    challengeRatingId: number;
    averageHitPoints: number;
    hitPointDice: IDDBMonsterHitPointDice;
    passivePerception: number;
    initiativeBonus: number | null;

    // Ability scores
    stats: IDDBMonsterStat[];

    // Saving throws & skills
    savingThrows: IDDBMonsterSavingThrow[];
    skills: IDDBMonsterSkill[];
    skillsHtml: string;

    // Movement & senses
    movements: IDDBMonsterMovement[];
    senses: IDDBMonsterSense[];
    sensesHtml: string;

    // Languages
    languages: IDDBMonsterLanguage[];
    languageDescription: string | null;
    languageNote: string | null;

    // Damage & conditions
    damageAdjustments: number[];
    conditionImmunities: number[];
    conditionImmunitiesHtml: string;

    // Descriptions (HTML strings, empty string when not applicable)
    characteristicsDescription: string | null;
    specialTraitsDescription: string;
    actionsDescription: string;
    reactionsDescription: string;
    bonusActionsDescription: string;
    legendaryActionsDescription: string;
    mythicActionsDescription: string;
    lairDescription: string;
    hasLair: boolean;

    // Optional fields (present on some older monster entries)
    extraGear?: string;
    extraTreasure?: string;
    extraInitiative?: number | null;

    // Fields set by companion/extra processing (not in standard API response)
    removedHitPoints?: number;
    temporaryHitPoints?: number;
    creatureGroupId?: number | null;
    creatureFlags?: any[];
    automatedEvocationAnimation?: any;
  }

  // ---- Top-level response ---------------------------------------------------

  interface IDDBMonsterSourceRequest {
    success: boolean;
    message: string;
    data: IDDBMonsterSourceData[];
  }
}
