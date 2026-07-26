// ---------------------------------------------------------------------------
// Foundry VTT dnd5e system – Actor document interfaces
// ---------------------------------------------------------------------------


export {};

global {

  // ---- Shared small types ---------------------------------------------------

  /** Roll min/max/mode triple used across abilities, skills, death saves, etc. */
  interface I5eRollConfig {
    min?: number | null;
    max?: number | null;
    mode?: number;
  }

  // ---- Abilities ------------------------------------------------------------

  interface I5eAbilitySaveConfig {
    roll?: I5eRollConfig;
  }

  interface I5eAbilityCheckConfig {
    roll: I5eRollConfig;
  }

  interface I5eAbilityBonuses {
    check?: string;
    save?: string;
  }

  interface I5eAbilityScore {
    value?: number;
    proficient?: number;
    max?: number | null;
    bonuses?: I5eAbilityBonuses;
    check?: I5eAbilityCheckConfig;
    save?: I5eAbilitySaveConfig;
  }

  export type I5eAbilities = Record<T5eAbility, I5eAbilityScore>;

  // ---- Attributes -----------------------------------------------------------

  interface I5eArmorClass {
    calc?: string;
    flat?: number | null;
    formula?: string;
    label?: string;
  }

  interface I5eAttunement {
    max: number;
  }

  interface I5eConcentration {
    ability?: string;
    bonuses?: { save: string };
    limit?: number;
    roll?: I5eRollConfig;
  }

  interface I5eDeathSaves {
    bonuses?: { save: string };
    failure?: number;
    success?: number;
    roll?: I5eRollConfig;
  }

  interface I5eHitDice {
    spent?: number;
  }

  interface I5eHitPoints {
    formula?: string;
    max?: number;
    min?: number;
    temp?: number;
    tempmax?: number;
    value?: number;
  }

  interface I5eInitiative {
    ability?: string;
    bonus?: string;
    roll?: I5eRollConfig;
  }

  type I5eMovementType = "walk" | "burrow" | "climb" | "fly" | "swim";

  type I5eMovementRecord = Partial<Record<I5eMovementType, string | null>>;

  interface I5eMovement extends I5eMovementRecord {
    hover?: boolean;
    units?: string;
    ignoredDifficultTerrain?: string[];
  }

  interface I5ePrice {
    denomination?: TCurrencyUnit;
    value?: number | null;
  }

  type TSenseType = "darkvision" | "blindsight" | "tremorsense" | "truesight";

  type T5eSenseRanges = Partial<Record<TSenseType, number | undefined>>;

  interface I5eSenses {
    ranges?: T5eSenseRanges;
    special?: string;
    units?: string;
  }

  interface I5eSpellAttribute {
    level?: number;
  }

  interface I5eMonsterAttributes {
    ac?: I5eArmorClass;
    attunement?: I5eAttunement;
    concentration?: I5eConcentration;
    death?: I5eDeathSaves;
    exhaustion?: number;
    hd?: I5eHitDice;
    hp?: I5eHitPoints;
    init?: I5eInitiative;
    loyalty?: Record<string, never>;
    movement?: I5eMovement;
    price?: I5ePrice;
    prof?: number;
    senses?: I5eSenses;
    spell?: I5eSpellAttribute;
    spellcasting?: string;
  }

  // ---- Bonuses --------------------------------------------------------------

  interface I5eAbilityBonusGroup {
    check?: string;
    save?: string;
    skill?: string;
  }

  interface I5eAttackBonus {
    attack?: string;
    damage?: string;
  }

  interface I5eSpellBonus {
    dc?: string;
  }

  type I5eAttackBonusTypes = "msak" | "mwak" | "rsak" | "rwak";

  interface I5eBonuses {
    abilities?: I5eAbilityBonusGroup;
    msak?: I5eAttackBonus;
    mwak?: I5eAttackBonus;
    rsak?: I5eAttackBonus;
    rwak?: I5eAttackBonus;
    spell?: I5eSpellBonus;
  }

  // ---- Currency -------------------------------------------------------------

  type TCurrencyUnit = "cp" | "sp" | "ep" | "gp" | "pp";

  interface I5eCurrency {
    cp?: number;
    sp?: number;
    ep?: number;
    gp?: number;
    pp?: number;
  }

  // ---- Details --------------------------------------------------------------

  interface I5eBiography {
    value: string;
    public: string;
  }

  interface I5eCreatureType {
    value?: string;
    subtype?: string | null;
    swarm?: TActorSizes | null;
    custom?: string | null;
  }

  interface I5eXP {
    value: number;
  }

  interface I5eHabitatEntry {
    type: string;
    subtype: string | null;
  }

  interface I5eHabitat {
    custom?: string;
    value?: I5eHabitatEntry[];
  }

  interface I5eTreasure {
    value: string[];
  }

  interface I5eDetails {
    alignment?: string;
    biography?: I5eBiography;
    bond?: string;
    cr?: number | null;
    environment?: string;
    flaw?: string;
    habitat?: I5eHabitat;
    ideal?: string;
    race?: string | null;
    treasure?: I5eTreasure;
    type?: I5eCreatureType;
    xp?: I5eXP;
  }

  // ---- Resources ------------------------------------------------------------

  interface I5eLairResource {
    value?: boolean;
    initiative?: number | null;
  }

  interface I5eLegendaryResource {
    value?: number;
    max?: number;
  }

  interface I5eMonsterResources {
    lair?: I5eLairResource;
    legact?: I5eLegendaryResource;
    legres?: I5eLegendaryResource;
  }

  // ---- Skills ---------------------------------------------------------------

  type T5eSkillKey = "acr"
    | "ani"
    | "arc"
    | "ath"
    | "dec"
    | "his"
    | "ins"
    | "itm"
    | "inv"
    | "med"
    | "nat"
    | "prc"
    | "prf"
    | "per"
    | "rel"
    | "slt"
    | "ste"
    | "sur";

  interface I5eSkill {
    ability?: T5eAbility;
    value?: number;
    // mod?: number;
    // passive?: number | null;
    // total?: number | null;
    bonuses?: {
      check?: string;
      passive?: string;
    };
    roll?: I5eRollConfig;
  }

  export type I5eSkills = Record<T5eSkillKey, I5eSkill>;

  // ---- Tool Proficiencies ---------------------------------------------------

  interface I5eToolProficiency {
    value?: number;
    ability?: T5eAbility;
    bonuses?: {
      check?: string;
    };
    roll?: I5eRollConfig;
  }

  // ---- Spell Slots ----------------------------------------------------------

  interface I5eSpellSlot {
    value: number;
    // string in source data, number once the live actor derives it
    max?: string;
    override?: number;
    // derived pact slot level on the live actor
    // level?: number;
  }

  interface I5eSpellSlots {
    pact?: I5eSpellSlot;
    spell1?: I5eSpellSlot;
    spell2?: I5eSpellSlot;
    spell3?: I5eSpellSlot;
    spell4?: I5eSpellSlot;
    spell5?: I5eSpellSlot;
    spell6?: I5eSpellSlot;
    spell7?: I5eSpellSlot;
    spell8?: I5eSpellSlot;
    spell9?: I5eSpellSlot;
  }

  // ---- Traits ---------------------------------------------------------------

  interface I5eDamageTraitSet extends I5eBaseProficiency {
    bypasses?: string[];
  }

  interface I5eDamageModification {
    amount?: Record<string, number>;
    bypasses?: string[];
  }

  interface I5eConditionTraitSet {
    value?: string[];
    custom?: string;
  }

  interface I5eBaseProficiency {
    value?: string[];
    custom?: string;
    communication?: Record<string, any>;
  }

  interface I5eWeaponMastery {
    value?: string[];
    bonus?: string[];
  }

  interface I5eWeaponProf extends I5eBaseProficiency {
    mastery?: I5eWeaponMastery;
  }

  interface I5eTraits {
    ci?: I5eConditionTraitSet;
    di?: I5eDamageTraitSet;
    dm?: I5eDamageModification;
    dr?: I5eDamageTraitSet;
    dv?: I5eDamageTraitSet;
    important?: boolean;
    languages?: I5eBaseProficiency;
    size?: TActorSizes;
    weaponProf?: I5eWeaponProf;
    armorProf?: I5eBaseProficiency;
  }

  // ---- System (top-level) ---------------------------------------------------

  interface I5eMonsterSystemData {
    abilities?: I5eAbilities;
    attributes?: I5eMonsterAttributes;
    bonuses?: I5eBonuses;
    currency?: I5eCurrency;
    details?: I5eDetails;
    identifier?: string;
    resources?: I5eMonsterResources;
    skills?: I5eSkills;
    source?: I5eSourceInfo;
    spells?: I5eSpellSlots;
    tools?: Record<string, I5eToolProficiency>;
    traits?: I5eTraits;
  }

  // ---- Prototype Token ------------------------------------------------------

  interface I5eTokenDetectionMode {
    range: number;
    enabled: boolean;
  }

  interface I5eTokenBar {
    attribute: string;
  }

  interface I5eTokenTexture {
    src?: string;
    tint?: string;
    alphaThreshold?: number;
    anchorX?: number;
    anchorY?: number;
    fit?: string;
    offsetX?: number;
    offsetY?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  }

  interface I5eTokenSight {
    enabled?: boolean;
    range?: number;
    angle?: number;
    visionMode?: string;
    attenuation?: number;
    brightness?: number;
    saturation?: number;
    contrast?: number;
  }

  interface I5eTokenLightAnimation {
    type?: string | null;
    speed?: number;
    intensity?: number;
    reverse?: boolean;
  }

  interface I5eTokenLight {
    alpha?: number;
    angle?: number;
    bright?: number;
    dim?: number;
    color?: string | null;
    coloration?: number;
    luminosity?: number;
    saturation?: number;
    contrast?: number;
    attenuation?: number;
    negative?: boolean;
    priority?: number;
    shadows?: number;
    animation?: I5eTokenLightAnimation;
    darkness?: { min: number; max: number };
  }

  interface I5eTokenRing {
    enabled?: boolean;
    effects?: number;
    colors?: { ring: string | null; background: string | null };
    subject?: { texture: string; scale: number };
  }

  interface I5eTokenTurnMarker {
    mode?: number;
    disposition?: boolean;
    animation?: string | null;
    src?: string | null;
  }

  interface I5ePrototypeToken {
    name?: string;
    displayName?: number;
    actorLink?: boolean;
    appendNumber?: boolean;
    prependAdjective?: boolean;
    width?: number;
    height?: number;
    lockRotation?: boolean;
    rotation?: number;
    alpha?: number;
    disposition?: number;
    displayBars?: number;
    bar1?: I5eTokenBar;
    bar2?: I5eTokenBar;
    light?: I5eTokenLight;
    sight?: I5eTokenSight;
    texture?: I5eTokenTexture;
    ring?: I5eTokenRing;
    detectionModes?: Record<string, I5eTokenDetectionMode>;
    occludable?: { radius: number };
    randomImg?: boolean;
    movementAction?: string | null;
    turnMarker?: I5eTokenTurnMarker;
    flags?: Record<string, any>;
  }


  // ---- Monster Munch flags --------------------------------------------------

  interface IMonsterMunchFlags {
    url?: string;
    img?: string;
    tokenImg?: string;
    isStockImg?: boolean;
    spellList?: Record<string, any>;
    overTime?: any[];
  }

  // ---- Top-level NPC document -----------------------------------------------

  interface I5eNPCActorFlags {
    ddbimporter?: IDDBImporterMonsterFlags;
    dnd5e?: I5eActorFlags;
    "midi-qol"?: IMidiQoLActorFlags;
    monsterMunch?: IMonsterMunchFlags;
  }

  interface I5eMonsterData extends I5eSystemBaseDocumentData {
    type: "npc";
    system: I5eMonsterSystemData;
    items: I5eMonsterItem[];
    flags?: I5eNPCActorFlags;
    prototypeToken?: I5ePrototypeToken;
    uuid?: string;
  }

  // ===========================================================================
  // PC (Player Character) interfaces
  // ===========================================================================

  // ---- PC Hit Points --------------------------------------------------------

  interface I5ePCHitPoints {
    max?: number | null;
    temp?: number;
    tempmax?: number;
    value?: number;
    bonuses?: {
      level?: string;
      overall?: string;
    };
  }

  // ---- PC Attributes --------------------------------------------------------

  interface I5ePCAttributes {
    ac?: I5eArmorClass;
    attunement?: I5eAttunement;
    concentration?: I5eConcentration;
    death?: I5eDeathSaves;
    exhaustion?: number;
    hp?: I5ePCHitPoints;
    init?: I5eInitiative;
    inspiration?: boolean;
    loyalty?: Record<string, never>;
    movement?: I5eMovement;
    senses?: I5eSenses;
    spellcasting?: string;
  }

  // ---- PC Resources ---------------------------------------------------------

  interface I5ePCResource {
    value?: number;
    max?: number;
    sr?: boolean;
    lr?: boolean;
    label?: string;
  }

  interface I5ePCResources {
    primary?: I5ePCResource;
    secondary?: I5ePCResource;
    tertiary?: I5ePCResource;
  }

  // ---- PC Details -----------------------------------------------------------

  interface I5ePCDetails {
    age?: string;
    alignment?: string;
    appearance?: string;
    /** Item ID of the background item. */
    background?: string;
    biography?: I5eBiography;
    bond?: string;
    eyes?: string;
    flaw?: string;
    gender?: string;
    hair?: string;
    height?: string;
    ideal?: string;
    /** Item ID of the starting class item. */
    originalClass?: string;
    /** Item ID of the race item. */
    race?: string;
    skin?: string;
    trait?: string;
    weight?: string;
    xp?: I5eXP;
  }

  // ---- PC Bastion -----------------------------------------------------------

  interface I5ePCBastion {
    name?: string;
    description?: string;
  }

  // ---- PC System Data -------------------------------------------------------

  interface I5ePCSystemData {
    abilities?: I5eAbilities;
    attributes?: I5ePCAttributes;
    bastion?: I5ePCBastion;
    bonuses?: I5eBonuses;
    currency?: I5eCurrency;
    details?: I5ePCDetails;
    favorites?: Record<string, any>[];
    resources?: I5ePCResources;
    skills?: I5eSkills;
    spells?: I5eSpellSlots;
    tools?: Record<string, I5eToolProficiency>;
    traits?: I5eTraits;
  }

  // ---- Class item -----------------------------------------------------------

  interface I5eClassHitDice {
    denomination?: string;
    spent?: number;
    additional?: string;
  }

  interface I5eClassSpellcasting {
    progression?: "full" | "half" | "third" | "pact" | "artificer" | null;
    preparation?: {
      formula?: string;
    };
    ability?: T5eAbility | null;
  }

  interface I5eClassPrimaryAbility {
    value?: T5eAbility[];
    all?: boolean;
  }

  interface I5eClassStartingEquipment {
    type?: string;
    _id?: string;
    group?: string;
    sort?: number;
    requiresProficiency?: boolean;
    count?: number | null;
    key?: string;
  }

  interface I5eClassSystemData {
    advancement?: Record<string, I5eAdvancement>;
    description?: I5eItemDescription;
    hd?: I5eClassHitDice;
    identifier?: string;
    levels?: number;
    primaryAbility?: I5eClassPrimaryAbility;
    properties?: string[];
    source?: I5eSourceInfo;
    spellcasting?: I5eClassSpellcasting;
    startingEquipment?: I5eClassStartingEquipment[];
    wealth?: string;
  }

  interface I5eClassItem extends I5eSystemBaseDocumentData {
    type: "class";
    system: I5eClassSystemData;
    flags: IItemFlagConfig;
  }

  type T5eClassTypes = I5eClassItem | I5eSubclassItem;

  // ---- Subclass item --------------------------------------------------------

  interface I5eSubclassSystemData {
    advancement?: Record<string, I5eAdvancement>;
    classIdentifier?: string;
    description?: I5eItemDescription;
    identifier?: string;
    source?: I5eSourceInfo;
    spellcasting?: I5eClassSpellcasting;
  }

  interface I5eSubclassItem extends I5eSystemBaseDocumentData {
    type: "subclass";
    system: I5eSubclassSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Race item ------------------------------------------------------------

  interface I5eRaceSystemData {
    advancement?: Record<string, I5eAdvancement>;
    description?: I5eItemDescription;
    identifier?: string;
    movement?: I5eMovement;
    senses?: I5eSenses;
    source?: I5eSourceInfo;
    type?: I5eCreatureType;
  }

  interface I5eRaceItem extends I5eSystemBaseDocumentData {
    type: "race";
    system: I5eRaceSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Background item ------------------------------------------------------

  interface I5eBackgroundSystemData {
    advancement?: Record<string, I5eAdvancement>;
    description?: I5eItemDescription;
    identifier?: string;
    source?: I5eSourceInfo;
    startingEquipment?: I5eClassStartingEquipment[];
    wealth?: string;
  }

  interface I5eBackgroundItem extends I5eSystemBaseDocumentData {
    type: "background";
    system: I5eBackgroundSystemData;
    flags: IItemFlagConfig & {
      dnd5e?: { advancementOrigin?: string };
    };
  }

  // ---- item union --------------------------------------------------------

  export type I5eClassItems = I5eClassItem | I5eSubclassItem;

  export type I5ePCItem =
    | I5eClassItems
    | I5eRaceItem
    | I5eBackgroundItem
    | I5eFeatItem
    | I5eSpellItem
    | I5eInventoryItem;

  export type I5eFeatureItem =
    | I5eFeatItem
    | I5eWeaponItem;

  type I5ePCConsumptionItems = I5eInventoryItem | I5eFeatItem | I5eWeaponItem | I5eSpellItem;

  type IEnricherItems = I5ePCConsumptionItems | I5eBackgroundItem;

  export type I5eMonsterItem =
    | I5eWeaponItem
    | I5eFeatItem
    | I5eSpellItem
    | I5eInventoryItem;

  // ---- PC DDB Importer flags ------------------------------------------------
  // PC ddbimporter flag interfaces (IDDBImporterPCFlags and friends) live in
  // flags.d.ts alongside the item/monster/base flag hierarchy.

  /** Character-sheet feature flags stored in `flags.dnd5e` on a PC actor. */
  interface I5ePCDnd5eFlags {
    powerfulBuild?: boolean;
    savageAttacks?: boolean;
    elvenAccuracy?: boolean;
    halflingLucky?: boolean;
    initiativeAdv?: boolean;
    initiativeAlert?: boolean;
    jackOfAllTrades?: boolean;
    weaponCriticalThreshold?: number;
    observantFeat?: boolean;
    remarkableAthlete?: boolean;
    reliableTalent?: boolean;
    diamondSoul?: boolean;
    meleeCriticalDamageDice?: number;
    wildMagic?: boolean;
    spellSniper?: boolean;
    tavernBrawlerFeat?: boolean;
    initiativeHalfProf?: boolean;
    // [key: string]: boolean | number | string | undefined;
  }


  interface IDDBPCDnDBeyondCampaignCharacterFlags {
    userId?: number;
    username?: string;
    characterId?: number;
    characterName?: string;
    characterUrl?: string;
    avatarUrl?: string;
    privacyType?: number;
    campaignId?: number | null;
    isAssigned?: boolean;
  }

  interface IDDBPCDnDBeyondCampaignFlags {
    id?: number;
    name?: string;
    description?: string;
    link?: string;
    publicNotes?: string;
    dmUserId?: number;
    dmUsername?: string;
    characters?: IDDBPCDnDBeyondCampaignCharacterFlags[];
  }

  interface IDDBPCDnDBeyondProficiencyFlags {
    name: string;
    custom: boolean;
  }

  interface IDDBPCDnDBeyondWeaponMasteryFlags {
    weapon: string;
    mastery: string;
    dnd5eName: string;
  }

  interface IDDBPCAutoAC {
    flat?: number | null;
    calc?: string;
    formula?: string;
  }

  interface IDDBImporterFlagsPrice {
    xgte?: boolean;
    value?: number;
  }

  interface IDDBImporterFlagsResources {
    type?: string;
    ask?: boolean;
    primary?: string;
    secondary?: string;
    tertiary?: string;
  }

  interface IDDBImporterFlagsAdventure {
    required?: Record<string, unknown>;
    revisitUuids?: string[];
  }

  /** ddbimporter flags stamped on PC actors (absorbs the old
   * IDDBPCImporterFlags from system-5e-actor.d.ts). */
  interface IDDBImporterPCFlags extends IDDBImporterFlagsBase {
    activeUpdate?: boolean;
    activeSyncSpells?: boolean;
    syncItemReady?: boolean;
    syncActionReady?: boolean;
    acEffects?: I5eEffectData[];
    baseAC?: number;
    autoAC?: IDDBPCAutoAC;
    overrideAC?: IDDBPCAutoAC;
    rolledHP?: boolean;
    baseHitPoints?: number;
    fixedBonusHitPointValuesWithEffects?: number;
    totalHP?: number;
    removedHitPoints?: number;
    resources?: IDDBImporterFlagsResources;
    useLocalPatreonKey?: boolean;
    framePath?: string | null;
    dndbeyond?: IDDBImporterPCDnDBeyondFlags;
  }

  /** ddbimporter flags stamped on NPC/monster actors. */
  interface IDDBImporterMonsterFlags extends IDDBImporterFlagsBase {
    creatureGroupId?: number | null;
    creatureFlags?: any[];
    automatedEvocationAnimation?: any;
    flatAC?: boolean;
    // companion/summons generation (DDBCompanionMixin)
    summons?: IDDBImporterFlagsSummons;
    dndbeyond?: IDDBImporterDnDBeyondBaseFlags;
  }

  interface I5ePCActorFlags {
    ddbimporter?: IDDBImporterPCFlags;
    dnd5e?: I5ePCDnd5eFlags;
    "midi-qol"?: { onUseMacroName?: string; [key: string]: any };
    "tidy5e-sheet"?: { maxPreparedSpells?: number; [key: string]: any };
    "tidy5e-sheet-kgar"?: Record<string, any>;
    "ddb-importer"?: Record<string, any>;
  }

  interface I5eActorFlags {
    // added by us
    DamageBonusMacro?: string;
    // added by us
    spellSniper?: boolean;
    // added by us
    sharpShooter?: string;
  };

  interface IMidiQoLActorFlags {
    dependentOn?: string; // UUID of parent document for midi-qol dependent tracking
    actions?: {
      // This really should be structured but actions.reaction is used in other modules and macros
      reaction?: boolean;
      reactionsUsed?: number;
      reactionsMax?: number;
      reactionsReset?: "eachTurn" | "onTurnStart" | "rest" | "never"; // When reactions reset default: onTurnStart
      action?: boolean;
      bonus?: boolean;
      bonusActionsUsed?: number;
      bonusActionsMax?: number;
      bonusActionsReset?: "eachTurn" | "onTurnStart" | "rest" | "never"; // When bonus actions reset default: onTurnStart
      reactionCombatRound?: number;
      bonusActionCombatRound?: number;
    };
    acBonus?: number;
    advantage?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: string;
      attack?: Record<string, string>;
      concentration?: string;
      deathSave?: string;
      skill?: Record<string, string>;
    };
    canFlank: string;
    carefulSpells?: boolean;
    concentrationSaveBonus?: number;
    critical?: Record<string, string>;
    damage?: {
      advantage?: boolean;
      "reroll-kh"?: boolean;
      "reroll-kl"?: boolean;
    };
    deathSaveBonus?: number;
    disadvantage?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: string;
      attack?: Record<string, string>;
      concentration?: string;
      deathSave?: string;
      skill?: Record<string, string>;
    };
    fail?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: string;
      attack?: Record<string, string>;
      critical?: Record<string, string>;
      deathSave?: string;
      disadvantage?: {
        heavy?: boolean;
      };
      skill?: Record<string, string>;
      spell?: {
        all?: string;
        verbal?: string;
        vocal?: string;
        somatic?: string;
        material?: string;
      };
      tool?: Record<string, string>;
    };
    grants?: {
      advantage?: {
        all?: string;
        attack?: Record<string, string>;
        check?: Record<string, string>;
        save?: Record<string, string>;
        skill?: Record<string, string>;
      };
      attack?: {
        bonus?: Record<string, string>;
        fail?: {
          all?: string;
        };
        success?: Record<string, string>;
      };
      bonus?: {
        damage?: Record<string, string>;
      };
      critical?: Record<string, string>;
      criticalThreshold?: string;
      disadvantage?: {
        all?: string;
        attack?: Record<string, string>;
        check?: Record<string, string>;
        save?: Record<string, string>;
        skill?: Record<string, string>;
      };
      fail?: {
        advantage?: {
          attack?: Record<string, string>;
        };
        disadvantage?: {
          attack?: Record<string, string>;
        };
      };
      max?: {
        damage?: Record<string, string>;
      };
      min?: {
        damage?: Record<string, string>;
      };
      noAdvantage?: {
        attack?: Record<string, string>;
      };
      noCritical?: Record<string, string>;
      fumble?: Record<string, string>;
      noFumble?: Record<string, string>;
      noDisadvantage?: {
        attack?: Record<string, string>;
      };
    };
    ignoreCover?: boolean;
    ignoreNearbyFoes?: boolean;
    ignoreWalls?: boolean;
    initiativeAdv?: string;
    initiativeDisadv?: string;
    inMotion?: boolean;
    long?: Record<string, string>;
    magicResistance?: {
      check?: { all?: string };
      save?: { all?: string };
      skill?: { all?: string };
    } & Record<string, string>;
    magicVulnerability?: Record<string, string>;
    max?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      damage?: Record<string, string>;
      deathSave?: string;
      skill?: {
        all?: string;
      };
      tool?: Record<string, string>;
    };
    min?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      damage?: Record<string, string>;
      deathSave?: string;
      skill?: {
        all?: string;
      };
      tool?: Record<string, string>;
    };
    neverTarget?: boolean;
    noAdvantage?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: string;
      attack?: Record<string, string>;
      concentration?: string;
      deathSave?: string;
      initiative?: string;
      skill?: Record<string, string>;
      tool?: Record<string, string>;
    };
    noDisadvantage?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: string;
      attack?: Record<string, string>;
      concentration?: string;
      deathSave?: string;
      initiative?: string;
      skill?: Record<string, string>;
      tool?: Record<string, string>;
    };
    noCritical?: Record<string, string>;
    noFumble?: Record<string, string>;
    fumble?: Record<string, string>;
    onUseMacroName?: string;
    onUseMacroParts?: OnUseMacros;
    optional?: Record<string, any>;
    OverTime?: string;
    potentCantrip?: boolean;
    range?: Record<string, string>;
    rangeOverride?: {
      attack?: Record<string, string>;
    };
    rollModifiers?: {
      attack?: Record<string, string>;
      damage?: Record<string, Record<string, string>>;
    };
    save?: {
      fail?: Record<string, string>;
    };
    sculptSpells?: boolean;
    semiSuperSaver?: Record<string, string>;
    sharpShooter?: string;
    success?: {
      ability?: {
        all?: string;
        check?: Record<string, string>;
        save?: Record<string, string>;
      };
      all?: boolean;
      attack?: Record<string, string>;
      deathSave?: string;
      skill?: Record<string, string>;
      tool?: Record<string, string>;
    };
    superSaver?: Record<string, string>;
    uncannyDodge?: boolean;
  };

  /** ddbimporter flags that can appear on any actor (PC or NPC). Used by the
   * generic Actor FlagConfig entry; per-document precision comes from
   * I5ePCData / I5eMonsterData. */
  interface IDDBImporterActorFlags extends
    IDDBImporterFlagsBase,
    IDDBImporterPCFlags,
    IDDBImporterMonsterFlags {
    dndbeyond?: IDDBImporterPCDnDBeyondFlags;
  }

  interface IActorFlagConfig {
    ddbimporter?: IDDBImporterActorFlags;
    dnd5e?: I5eActorFlags;
    "midi-qol"?: IMidiQoLActorFlags;
  };

  /** dndbeyond flags stamped on PC actors. */
  interface IDDBImporterPCDnDBeyondFlags extends IDDBImporterDnDBeyondBaseFlags {
    // Character identity
    characterId?: string;
    url?: string | null;
    json?: string;
    roUrl?: string | null;

    // Character stats
    totalLevels?: number | null;
    profBonus?: number;
    proficiencies?: IDDBPCDnDBeyondProficiencyFlags[] | null;
    proficienciesIncludingEffects?: IDDBPCDnDBeyondProficiencyFlags[] | null;
    effectAbilities?: I5eAbilities | null;
    abilityOverrides?: Record<T5eAbility, number> | null;
    characterValues?: IDDBCharacterValue[] | null;
    templateStrings?: IDDBTemplateStringResult[] | null;
    campaign?: IDDBPCDnDBeyondCampaignFlags | null;
    weaponMasteries?: IDDBPCDnDBeyondWeaponMasteryFlags[];
  }

  // ---- Top-level PC document ------------------------------------------------

  interface I5ePCData extends I5eSystemBaseDocumentData {
    type: "character";
    system: I5ePCSystemData;
    items?: I5ePCItem[];
    flags?: I5ePCActorFlags;
    prototypeToken?: I5ePrototypeToken;
    uuid?: string;
  }

  type I5eActorData = I5eMonsterData | I5ePCData | I5eVehicleData;

  /** Implementation Actor with the ddbimporter flag shape the importer reads/writes.
   * The system/items unions keep this a supertype of TSyncCharacterActor while still
   * accepting a bare Actor.Implementation from the muncher call sites. */
  type TImporterActor = Omit<Actor.Implementation, "system" | "flags" | "items"> & {
    items: Actor.Implementation["items"] | Collection<TImporterItem>;
    system: Actor.Implementation["system"] | I5ePCSystemData;
    flags: I5ePCActorFlags;
  };

  /** Live character Actor with the PC system/flag shapes; Actor.Implementation's
   * system union does not narrow, so the updater/sync code uses this view.
   * Omit the overridden keys before intersecting so the original system/flags
   * unions are never merged (avoids "excessively deep" instantiation). */
  type TSyncCharacterActor = Omit<Actor.Implementation, "system" | "flags" | "items"> & {
    items: Collection<TImporterItem>;
    system: I5ePCSystemData;
    flags: I5ePCActorFlags;
  };

}
