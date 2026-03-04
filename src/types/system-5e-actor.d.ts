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

  export type I5eAbilities = Record<string, I5eAbilityScore>;

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

  interface I5eMovement {
    walk?: string | number | null;
    burrow?: string | number | null;
    climb?: string | number | null;
    fly?: string | number | null;
    swim?: string | number | null;
    hover?: boolean;
    units?: string;
    ignoredDifficultTerrain?: string[];
  }

  interface I5ePrice {
    denomination?: string;
    value?: number | null;
  }

  interface I5eSenses {
    blindsight?: number;
    darkvision?: number;
    tremorsense?: number;
    truesight?: number;
    special?: string;
    units?: string;
  }

  interface I5eSpellAttribute {
    level?: number;
  }

  interface I5eAttributes {
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

  interface I5eBonuses {
    abilities?: I5eAbilityBonusGroup;
    msak?: I5eAttackBonus;
    mwak?: I5eAttackBonus;
    rsak?: I5eAttackBonus;
    rwak?: I5eAttackBonus;
    spell?: I5eSpellBonus;
  }

  // ---- Currency -------------------------------------------------------------

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
    subtype?: string;
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
    cr?: number;
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

  interface I5eSkill {
    ability?: string;
    value?: number;
    mod?: number;
    passive?: number | null;
    total?: number | null;
    bonuses?: {
      check?: string;
      passive?: string;
    };
    roll?: I5eRollConfig;
  }

  export type I5eSkills = Record<string, I5eSkill>;

  // ---- Tool Proficiencies ---------------------------------------------------

  interface I5eToolProficiency {
    value?: number;
    ability?: string;
    bonuses?: {
      check?: string;
    };
    roll?: I5eRollConfig;
  }

  // ---- Spell Slots ----------------------------------------------------------

  interface I5eSpellSlot {
    value: number;
    max?: string;
    override?: number;
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

  interface I5eDamageTraitSet {
    value?: string[];
    bypasses?: string[];
    custom?: string;
  }

  interface I5eDamageModification {
    amount?: Record<string, number>;
    bypasses?: string[];
  }

  interface I5eConditionTraitSet {
    value?: string[];
    custom?: string;
  }

  interface I5eLanguages {
    value?: string[];
    custom?: string;
  }

  interface I5eTraits {
    ci?: I5eConditionTraitSet;
    di?: I5eDamageTraitSet;
    dm?: I5eDamageModification;
    dr?: I5eDamageTraitSet;
    dv?: I5eDamageTraitSet;
    important?: boolean;
    languages?: I5eLanguages;
    size?: string;
  }

  // ---- System (top-level) ---------------------------------------------------

  interface I5eMonsterSystemData {
    abilities?: I5eAbilities;
    attributes?: I5eAttributes;
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
    id: string;
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
    detectionModes?: I5eTokenDetectionMode[];
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


  // ---- Advancement types ----------------------------------------------------

  interface I5eAdvancementBase {
    _id: string;
    type: string;
    title?: string;
    hint?: string;
    level?: number;
    classRestriction?: "primary" | "secondary";
    icon?: string | null;
  }

  export type I5eAdvScaleValueType =
    "number" | "dice" | "string" | "boolean" | "distance" | "cr" | string;

  interface I5eAdvScaleValueNumericEntry { value?: number | string }

  interface I5eAdvScaleValueDiceEntry {
    number?: number;
    faces?: number;
    modifiers?: string[];
  }

  export type I5eAdvScaleValueEntry =
    I5eAdvScaleValueNumericEntry | I5eAdvScaleValueDiceEntry;

  interface I5eAdvScaleValueConfig {
    identifier?: string;
    type?: I5eAdvScaleValueType;
    distance?: { units?: string };
    scale?: Record<string, I5eAdvScaleValueEntry>;
  }
  interface I5eAdvancementScaleValue extends I5eAdvancementBase {
    type: "ScaleValue";
    configuration: I5eAdvScaleValueConfig;
    value: Record<string, never>;
  }

  interface I5eAdvItemGrantItem { uuid: string; optional?: boolean }
  interface I5eAdvItemGrantConfig {
    items?: I5eAdvItemGrantItem[];
    optional?: boolean;
    spell?: Record<string, any> | null;
  }
  interface I5eAdvancementItemGrant extends I5eAdvancementBase {
    type: "ItemGrant";
    configuration: I5eAdvItemGrantConfig;
    /** Keys are local item IDs; values are compendium UUIDs, populated after grant. */
    value: { added?: Record<string, string> };
  }

  interface I5eAdvASIConfig {
    cap?: number;
    fixed?: Record<string, number>;
    locked?: string[];
    points?: number;
    recommendation?: string | null;
    max?: number | null;
  }
  interface I5eAdvancementAbilityScoreImprovement extends I5eAdvancementBase {
    type: "AbilityScoreImprovement";
    configuration: I5eAdvASIConfig;
    value: { type?: "asi" | "feat"; feat?: Record<string, string> };
  }

  interface I5eAdvancementHitPoints extends I5eAdvancementBase {
    type: "HitPoints";
    configuration: Record<string, never>;
    /** Keys are level strings ("1"–"20"); values are "max", "avg", or a rolled number. */
    value: Record<string, "max" | "avg" | number>;
  }

  interface I5eAdvTraitChoice {
    count?: number;
    pool?: string[];
    replacement?: boolean;
  }
  interface I5eAdvTraitConfig {
    mode?: "default" | "expertise" | "mastery" | "upgrade" | string;
    allowReplacements?: boolean;
    grants?: string[];
    choices?: I5eAdvTraitChoice[];
  }
  interface I5eAdvancementTrait extends I5eAdvancementBase {
    type: "Trait";
    configuration: I5eAdvTraitConfig;
    value: { chosen?: string[] };
  }

  interface I5eAdvItemChoiceLevelConfig {
    count?: number | null;
    replacement?: boolean;
  }
  interface I5eAdvItemChoiceRestriction {
    type?: string;
    subtype?: string;
    list?: string[];
  }
  interface I5eAdvItemChoiceConfig {
    choices?: Record<string, I5eAdvItemChoiceLevelConfig>;
    allowDrops?: boolean;
    type?: string;
    pool?: { uuid: string }[];
    spell?: Record<string, any> | null;
    restriction?: I5eAdvItemChoiceRestriction;
  }
  interface I5eAdvancementItemChoice extends I5eAdvancementBase {
    type: "ItemChoice";
    configuration: I5eAdvItemChoiceConfig;
    value: { added?: Record<string, string>; replaced?: Record<string, string> };
  }

  interface I5eAdvancementSubclass extends I5eAdvancementBase {
    type: "Subclass";
    configuration: Record<string, never>;
    value: { document?: any; uuid?: string | null };
  }

  interface I5eAdvancementSize extends I5eAdvancementBase {
    type: "Size";
    configuration: { sizes?: string[] };
    value: { size?: string };
  }

  export type I5eAdvancement =
    | I5eAdvancementScaleValue
    | I5eAdvancementItemGrant
    | I5eAdvancementAbilityScoreImprovement
    | I5eAdvancementHitPoints
    | I5eAdvancementTrait
    | I5eAdvancementItemChoice
    | I5eAdvancementSubclass
    | I5eAdvancementSize;


  // ---- Top-level NPC document -----------------------------------------------

  interface I5eMonsterData extends I5eSystemBaseDocumentData {
    type: "npc";
    system: I5eMonsterSystemData;
    items: I5eMonsterItem[];
    flags?: IActorFlagConfig & { monsterMunch?: IMonsterMunchFlags };
    prototypeToken?: I5ePrototypeToken;
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
    progression?: "full" | "half" | "third" | "pact" | null;
    preparation?: {
      formula?: string;[];
    };
    ability?: "str" | "dex" | "con" | "int" | "wis" | "cha" | null;
  }

  interface I5eClassPrimaryAbility {
    value?: ("str" | "dex" | "con" | "int" | "wis" | "cha")[];
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
    advancement?: I5eAdvancement[];
    description?: I5eItemDescription;
    hd?: I5eClassHitDice;
    identifier?: string;
    levels?: number;
    primaryAbility?: I5eClassPrimaryAbility;
    properties?: string[];
    source?: I5eItemSourceRef;
    spellcasting?: I5eClassSpellcasting;
    startingEquipment?: I5eClassStartingEquipment[];
    wealth?: string;
  }

  interface I5eClassItem extends I5eSystemBaseDocumentData {
    type: "class";
    system: I5eClassSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Subclass item --------------------------------------------------------

  interface I5eSubclassSystemData {
    advancement?: I5eAdvancement[];
    classIdentifier?: string;
    description?: I5eItemDescription;
    identifier?: string;
    source?: I5eItemSourceRef;
    spellcasting?: I5eClassSpellcasting;
  }

  interface I5eSubclassItem extends I5eSystemBaseDocumentData {
    type: "subclass";
    system: I5eSubclassSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Race item ------------------------------------------------------------

  interface I5eRaceSystemData {
    advancement?: I5eAdvancement[];
    description?: I5eItemDescription;
    identifier?: string;
    movement?: I5eMovement;
    senses?: I5eSenses;
    source?: I5eItemSourceRef;
    type?: I5eCreatureType;
  }

  interface I5eRaceItem extends I5eSystemBaseDocumentData {
    type: "race";
    system: I5eRaceSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Background item ------------------------------------------------------

  interface I5eBackgroundSystemData {
    advancement?: I5eAdvancement[];
    description?: I5eItemDescription;
    identifier?: string;
    source?: I5eItemSourceRef;
    startingEquipment?: I5eClassStartingEquipment[];
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

  export type I5eMonsterItem =
    | I5eWeaponItem
    | I5eFeatItem
    | I5eSpellItem
    | I5eInventoryItem;

  // ---- PC DDB Importer flags ------------------------------------------------

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

  interface IDDBPCDnDBeyondFlags {
    characterId?: string;
    url?: string;
    totalLevels?: number;
    proficiencies?: any;
    proficienciesIncludingEffects?: any;
    roUrl?: string | null;
    characterValues?: any;
    templateStrings?: any;
    campaign?: IDDBPCDnDBeyondCampaignFlags;
    profBonus?: number;
    weaponMasteries?: any[];
    effectAbilities?: any;
    abilityOverrides?: Record<string, number>;
  }

  interface IDDBPCAutoAC {
    flat?: number | null;
    calc?: string;
    formula?: string;
  }

  interface IDDBPCImporterFlags {
    dndbeyond?: IDDBPCDnDBeyondFlags;
    activeUpdate?: boolean;
    compendium?: boolean;
    acEffects?: IEffectData[];
    baseAC?: number;
    autoAC?: IDDBPCAutoAC;
    overrideAC?: IDDBPCAutoAC;
    rolledHP?: boolean;
    baseHitPoints?: number;
    fixedBonusHitPointValuesWithEffects?: number;
    totalHP?: number;
    removedHitPoints?: number;
    resources?: {
      ask?: boolean;
      type?: string;
      primary?: string;
      secondary?: string;
      tertiary?: string;
    };
    importId?: string;
    syncItemReady?: boolean;
    syncActionReady?: boolean;
    activeSyncSpells?: boolean;
  }

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

  interface I5ePCActorFlags {
    ddbimporter?: IDDBPCImporterFlags;
    dnd5e?: I5ePCDnd5eFlags;
    "midi-qol"?: { onUseMacroName?: string; [key: string]: any };
    "tidy5e-sheet"?: { maxPreparedSpells?: number; [key: string]: any };
    "tidy5e-sheet-kgar"?: Record<string, any>;
    "ddb-importer"?: Record<string, any>;
  }

  // ---- Top-level PC document ------------------------------------------------

  interface I5ePCData extends I5eSystemBaseDocumentData {
    type: "character";
    system: I5ePCSystemData;
    items: I5ePCItem[];
    flags?: I5ePCActorFlags;
    prototypeToken?: I5ePrototypeToken;
  }

  export type I5eActorData = I5eMonsterData | I5ePCData;
}
