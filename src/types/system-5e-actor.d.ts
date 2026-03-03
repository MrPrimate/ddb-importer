// ---------------------------------------------------------------------------
// Foundry VTT dnd5e system – NPC (Monster) document interfaces
// ---------------------------------------------------------------------------

export {};

global {

  // ---- Shared small types ---------------------------------------------------

  /** Roll min/max/mode triple used across abilities, skills, death saves, etc. */
  export interface I5eRollConfig {
    min?: number | null;
    max?: number | null;
    mode?: number;
  }

  // ---- Abilities ------------------------------------------------------------

  export interface I5eAbilitySaveConfig {
    roll?: I5eRollConfig;
  }

  export interface I5eAbilityCheckConfig {
    roll: I5eRollConfig;
  }

  export interface I5eAbilityBonuses {
    check?: string;
    save?: string;
  }

  export interface I5eAbilityScore {
    value?: number;
    proficient?: number;
    max?: number | null;
    bonuses?: I5eAbilityBonuses;
    check?: I5eAbilityCheckConfig;
    save?: I5eAbilitySaveConfig;
  }

  export type I5eAbilities = Record<string, I5eAbilityScore>;

  // ---- Attributes -----------------------------------------------------------

  export interface I5eArmorClass {
    calc?: string;
    flat?: number | null;
    formula?: string;
    label?: string;
  }

  export interface I5eAttunement {
    max: number;
  }

  export interface I5eConcentration {
    ability?: string;
    bonuses?: { save: string };
    limit?: number;
    roll?: I5eRollConfig;
  }

  export interface I5eDeathSaves {
    bonuses?: { save: string };
    failure?: number;
    success?: number;
    roll?: I5eRollConfig;
  }

  export interface I5eHitDice {
    spent?: number;
  }

  export interface I5eHitPoints {
    formula?: string;
    max?: number;
    min?: number;
    temp?: number;
    tempmax?: number;
    value?: number;
  }

  export interface I5eInitiative {
    ability?: string;
    bonus?: string;
    roll?: I5eRollConfig;
  }

  export interface I5eMovement {
    walk?: string | number | null;
    burrow?: string | number | null;
    climb?: string | number | null;
    fly?: string | number | null;
    swim?: string | number | null;
    hover?: boolean;
    units?: string;
    ignoredDifficultTerrain?: string[];
  }

  export interface I5ePrice {
    denomination?: string;
    value?: number | null;
  }

  export interface I5eSenses {
    blindsight?: number;
    darkvision?: number;
    tremorsense?: number;
    truesight?: number;
    special?: string;
    units?: string;
  }

  export interface I5eSpellAttribute {
    level?: number;
  }

  export interface I5eAttributes {
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

  export interface I5eAbilityBonusGroup {
    check?: string;
    save?: string;
    skill?: string;
  }

  export interface I5eAttackBonus {
    attack?: string;
    damage?: string;
  }

  export interface I5eSpellBonus {
    dc?: string;
  }

  export interface I5eBonuses {
    abilities?: I5eAbilityBonusGroup;
    msak?: I5eAttackBonus;
    mwak?: I5eAttackBonus;
    rsak?: I5eAttackBonus;
    rwak?: I5eAttackBonus;
    spell?: I5eSpellBonus;
  }

  // ---- Currency -------------------------------------------------------------

  export interface I5eCurrency {
    cp?: number;
    sp?: number;
    ep?: number;
    gp?: number;
    pp?: number;
  }

  // ---- Details --------------------------------------------------------------

  export interface I5eBiography {
    value: string;
    public: string;
  }

  export interface I5eCreatureType {
    value?: string;
    subtype?: string;
  }

  export interface I5eXP {
    value: number;
  }

  export interface I5eHabitatEntry {
    type: string;
    subtype: string | null;
  }

  export interface I5eHabitat {
    custom?: string;
    value?: I5eHabitatEntry[];
  }

  export interface I5eTreasure {
    value: string[];
  }

  export interface I5eDetails {
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

  export interface I5eLairResource {
    value?: boolean;
    initiative?: number | null;
  }

  export interface I5eLegendaryResource {
    value?: number;
    max?: number;
  }

  export interface I5eMonsterResources {
    lair?: I5eLairResource;
    legact?: I5eLegendaryResource;
    legres?: I5eLegendaryResource;
  }

  // ---- Skills ---------------------------------------------------------------

  export interface I5eSkill {
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

  export interface I5eToolProficiency {
    value?: number;
    ability?: string;
    bonuses?: {
      check?: string;
    };
    roll?: I5eRollConfig;
  }

  // ---- Source ---------------------------------------------------------------

  export interface I5eSourceInfo {
    book?: string;
    custom?: string;
    id?: number;
    license?: string;
    page?: string;
    rules?: string;
    sourceCategoryId?: number;
  }

  // ---- Spell Slots ----------------------------------------------------------

  export interface I5eSpellSlot {
    value: number;
    max?: string;
    override?: number;
  }

  export interface I5eSpellSlots {
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

  export interface I5eDamageTraitSet {
    value?: string[];
    bypasses?: string[];
    custom?: string;
  }

  export interface I5eDamageModification {
    amount?: Record<string, number>;
    bypasses?: string[];
  }

  export interface I5eConditionTraitSet {
    value?: string[];
    custom?: string;
  }

  export interface I5eLanguages {
    value?: string[];
    custom?: string;
  }

  export interface I5eTraits {
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

  export interface I5eMonsterSystemData {
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

  export interface I5eTokenDetectionMode {
    id: string;
    range: number;
    enabled: boolean;
  }

  export interface I5eTokenBar {
    attribute: string;
  }

  export interface I5eTokenTexture {
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

  export interface I5eTokenSight {
    enabled?: boolean;
    range?: number;
    angle?: number;
    visionMode?: string;
    attenuation?: number;
    brightness?: number;
    saturation?: number;
    contrast?: number;
  }

  export interface I5eTokenLightAnimation {
    type?: string | null;
    speed?: number;
    intensity?: number;
    reverse?: boolean;
  }

  export interface I5eTokenLight {
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

  export interface I5eTokenRing {
    enabled?: boolean;
    effects?: number;
    colors?: { ring: string | null; background: string | null };
    subject?: { texture: string; scale: number };
  }

  export interface I5eTokenTurnMarker {
    mode?: number;
    disposition?: boolean;
    animation?: string | null;
    src?: string | null;
  }

  export interface I5ePrototypeToken {
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

  // ---- Document stats -------------------------------------------------------

  export interface I5eDocumentStats {
    systemId?: string;
    systemVersion?: string;
    coreVersion?: string;
    compendiumSource?: string | null;
    duplicateSource?: string | null;
    exportSource?: string | null;
    lastModifiedBy?: string | null;
  }

  // ---- Monster Munch flags --------------------------------------------------

  export interface IMonsterMunchFlags {
    url?: string;
    img?: string;
    tokenImg?: string;
    isStockImg?: boolean;
    spellList?: Record<string, any>;
    overTime?: any[];
  }

  // ---- Item shared sub-types ------------------------------------------------

  export interface I5eItemDescription {
    value: string;
    chat: string;
  }

  // Uses I5eSystemLimitedUsesRecovery from system-5e.d.ts (identical shape)
  // Uses I5eSystemLimitedUses from system-5e.d.ts (identical shape)

  export interface I5eItemSourceRef {
    book?: string;
    page?: string;
    license?: string;
    custom?: string;
    revision: number;
    rules: string;
  }

  export interface I5eItemWeight {
    value: number;
    units: string;
  }

  // ---- Damage parts ---------------------------------------------------------

  export interface I5eDamageScaling {
    mode?: string;
    number?: number | null;
    formula?: string;
  }

  export interface I5eDamageCustom {
    enabled: boolean;
    formula: string;
  }

  export type I5eDamageType = "acid" | "bludgeoning" | "cold" | "fire" | "force" | "lightning" | "necrotic" | "piercing" | "poison" | "psychic" | "radiant" | "slashing" | "thunder" | string;

  export interface I5eDamagePart {
    number: number;
    denomination: number;
    bonus: string;
    types: I5eDamageType[];
    custom: I5eDamageCustom;
    scaling: I5eDamageScaling;
  }

  export interface I5eDamageBase {
    base: I5eDamagePart;
    onSave: string | null;
  }

  // -- Consumption Targets ----------------------------------------------------

  export interface I5eConsumptionTargetScaling {
    allowed?: boolean;
    mode?: "" | "amount" | "level" | string;
    max?: string;
    formula?: string;
  }

  export interface I5eConsumptionTarget {
    type: "itemUses" | "activityUses" | "spellSlots" | "attribute" | string;
    target: string;
    value: string | number;
    scaling?: I5eConsumptionTargetScaling;
  }

  // ---- Activities -----------------------------------------------------------

  export interface I5eActivityActivation {
    type: string;
    value?: number;
    condition?: string;
    override?: boolean;
  }

  export interface I5eActivityConsumption {
    targets: I5eConsumptionTarget[];
    scaling: { allowed: boolean; max: string };
    spellSlot?: boolean;
  }

  export interface I5eActivityTarget {
    template: {
      count: string;
      contiguous: boolean;
      type: string;
      size: string;
      width: string;
      height: string;
      units: string;
    };
    affects: {
      count: string;
      type: string;
      choice: boolean;
      special: string;
    };
    prompt: boolean;
    override: boolean;
  }

  export interface I5eActivityRange {
    value?: number | string | null;
    long?: number | null;
    units: string;
    reach?: string | null;
    override?: boolean;
    special?: string;
  }

  // Uses IActivityVisibilityData from activities.d.ts (identical shape)
  // Uses I5eSystemLimitedUses from system-5e.d.ts for activity uses
  // Uses IMidiActivityProperties from activities.d.ts

  /** Fields common to all activity types. */
  export interface I5eActivityBase {
    _id: string;
    type: string;
    sort: number;
    name?: string;
    img?: string;
    activation: I5eActivityActivation;
    consumption: I5eActivityConsumption;
    description: Record<string, any>;
    duration: { value: string; units: string };
    effects?: any[];
    flags: Record<string, any>;
    range: I5eActivityRange;
    target: I5eActivityTarget;
    uses: I5eSystemLimitedUses;
    visibility: IActivityVisibilityData;
    midiProperties?: IMidiActivityProperties;
    otherActivityId?: string;
  }

  export interface I5eAttackActivity extends I5eActivityBase {
    type: "attack";
    attack: {
      ability: string;
      bonus: string;
      critical: Record<string, any>;
      flat: boolean;
      type: { value: string; classification: string };
    };
    damage: {
      critical: Record<string, any>;
      onSave?: string;
      includeBase: boolean;
      parts: I5eDamagePart[];
    };
  }

  export interface I5eSaveActivity extends I5eActivityBase {
    type: "save";
    save: {
      ability: string | string[];
      dc: { calculation: string; formula: string };
    };
    damage: {
      critical?: Record<string, any>;
      onSave?: string;
      includeBase?: boolean;
      parts: I5eDamagePart[];
    };
  }

  export interface I5eUtilityActivity extends I5eActivityBase {
    type: "utility";
    roll: { prompt: boolean; visible: boolean };
  }

  export interface I5eDamageActivity extends I5eActivityBase {
    type: "damage";
    damage: {
      critical?: Record<string, any>;
      parts: I5eDamagePart[];
    };
  }

  export interface I5eHealActivity extends I5eActivityBase {
    type: "heal";
    healing: {
      number: number;
      denomination: number;
      bonus: string;
      types: string[];
      custom: I5eDamageCustom;
      scaling: I5eDamageScaling;
    };
  }

  export interface I5eCastActivity extends I5eActivityBase {
    type: "cast";
    spell: Record<string, any>;
  }

  export interface I5eSummonsMatch {
    proficiency?: boolean;
    attacks?: boolean;
    saves?: boolean;
  }

  export interface I5eSummonsBonuses {
    ac?: string;
    hp?: string;
    attackDamage?: string;
    saveDamage?: string;
    healing?: string;
  }

  export interface I5eSummonActivity extends I5eActivityBase {
    type: "summon";
    bonuses: I5eSummonsBonuses;
    creatureSizes: string[];
    creatureTypes: string[];
    match: I5eSummonsMatch;
    profiles: any[];
    summon: Record<string, any>;
  }

  export interface I5eCheckActivity extends I5eActivityBase {
    type: "check";
    check: Record<string, any>;
    damage: {
      critical?: Record<string, any>;
      parts: I5eDamagePart[];
    };
  }

  export interface I5eDDBMacroActivity extends I5eActivityBase {
    type: "ddbmacro";
    macro: Record<string, any>;
  }

  export interface I5eEnchantActivity extends I5eActivityBase {
    type: "enchant";
    enchant: Record<string, any>;
    restrictions: Record<string, any>;
  }

  export interface I5eForwardActivity {
    _id: string;
    type: "forward";
    sort: number;
    name?: string;
    activation: I5eActivityActivation;
    activity: Record<string, any>;
    consumption: I5eActivityConsumption;
    description: Record<string, any>;
    flags: Record<string, any>;
    uses: I5eSystemLimitedUses;
    visibility: IActivityVisibilityData;
  }

  export type I5eActivity =
    | I5eAttackActivity
    | I5eSaveActivity
    | I5eUtilityActivity
    | I5eDamageActivity
    | I5eHealActivity
    | I5eCastActivity
    | I5eSummonActivity
    | I5eCheckActivity
    | I5eDDBMacroActivity
    | I5eEnchantActivity
    | I5eForwardActivity;

  // ---- Item flag sub-types --------------------------------------------------

  export interface I5eMonsterMunchItemFlags {
    titleHTML: string;
    fullName: string;
    actionCopy: boolean;
    type: "action" | "special" | "legendary" | "bonus" | "reaction" | "lair" | "mythic";
    actionData: Record<string, any>;
  }

  export interface I5eMidiItemProperties {
    saveDamage?: string;
    otherSaveDamage?: string;
    autoFailFriendly?: boolean;
    confirmTargets?: string;
    magicdam?: boolean;
    magiceffect?: boolean;
  }

  // ---- Advancement types ----------------------------------------------------

  export interface I5eAdvancementBase {
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

  export interface I5eAdvScaleValueNumericEntry { value?: number | string }

  export interface I5eAdvScaleValueDiceEntry {
    number?: number;
    faces?: number;
    modifiers?: string[];
  }

  export type I5eAdvScaleValueEntry =
    I5eAdvScaleValueNumericEntry | I5eAdvScaleValueDiceEntry;

  export interface I5eAdvScaleValueConfig {
    identifier?: string;
    type?: I5eAdvScaleValueType;
    distance?: { units?: string };
    scale?: Record<string, I5eAdvScaleValueEntry>;
  }
  export interface I5eAdvancementScaleValue extends I5eAdvancementBase {
    type: "ScaleValue";
    configuration: I5eAdvScaleValueConfig;
    value: Record<string, never>;
  }

  export interface I5eAdvItemGrantItem { uuid: string; optional?: boolean }
  export interface I5eAdvItemGrantConfig {
    items?: I5eAdvItemGrantItem[];
    optional?: boolean;
    spell?: Record<string, any> | null;
  }
  export interface I5eAdvancementItemGrant extends I5eAdvancementBase {
    type: "ItemGrant";
    configuration: I5eAdvItemGrantConfig;
    /** Keys are local item IDs; values are compendium UUIDs, populated after grant. */
    value: { added?: Record<string, string> };
  }

  export interface I5eAdvASIConfig {
    cap?: number;
    fixed?: Record<string, number>;
    locked?: string[];
    points?: number;
    recommendation?: string | null;
    max?: number | null;
  }
  export interface I5eAdvancementAbilityScoreImprovement extends I5eAdvancementBase {
    type: "AbilityScoreImprovement";
    configuration: I5eAdvASIConfig;
    value: { type?: "asi" | "feat"; feat?: Record<string, string> };
  }

  export interface I5eAdvancementHitPoints extends I5eAdvancementBase {
    type: "HitPoints";
    configuration: Record<string, never>;
    /** Keys are level strings ("1"–"20"); values are "max", "avg", or a rolled number. */
    value: Record<string, "max" | "avg" | number>;
  }

  export interface I5eAdvTraitChoice {
    count?: number;
    pool?: string[];
    replacement?: boolean;
  }
  export interface I5eAdvTraitConfig {
    mode?: "default" | "expertise" | "mastery" | "upgrade" | string;
    allowReplacements?: boolean;
    grants?: string[];
    choices?: I5eAdvTraitChoice[];
  }
  export interface I5eAdvancementTrait extends I5eAdvancementBase {
    type: "Trait";
    configuration: I5eAdvTraitConfig;
    value: { chosen?: string[] };
  }

  export interface I5eAdvItemChoiceLevelConfig {
    count?: number | null;
    replacement?: boolean;
  }
  export interface I5eAdvItemChoiceRestriction {
    type?: string;
    subtype?: string;
    list?: string[];
  }
  export interface I5eAdvItemChoiceConfig {
    choices?: Record<string, I5eAdvItemChoiceLevelConfig>;
    allowDrops?: boolean;
    type?: string;
    pool?: { uuid: string }[];
    spell?: Record<string, any> | null;
    restriction?: I5eAdvItemChoiceRestriction;
  }
  export interface I5eAdvancementItemChoice extends I5eAdvancementBase {
    type: "ItemChoice";
    configuration: I5eAdvItemChoiceConfig;
    value: { added?: Record<string, string>; replaced?: Record<string, string> };
  }

  export interface I5eAdvancementSubclass extends I5eAdvancementBase {
    type: "Subclass";
    configuration: Record<string, never>;
    value: { document?: any; uuid?: string | null };
  }

  export interface I5eAdvancementSize extends I5eAdvancementBase {
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

  // ---- Weapon item ----------------------------------------------------------

  export interface I5eWeaponSystemData {
    activities: Record<string, I5eActivity>;
    advancement?: I5eAdvancement[];
    ammunition: Record<string, any>;
    armor: Record<string, any>;
    attuned: boolean;
    attunement: string;
    container: string | null;
    crew: { value: any[] };
    damage: I5eDamageBase;
    description: I5eItemDescription;
    equipped: boolean;
    identified: boolean;
    identifier: string;
    mastery?: string;
    price: I5ePrice;
    proficient: boolean | null;
    properties: string[];
    quantity: number;
    range: {
      value: number | null;
      long: number | null;
      units: string;
      reach: string;
    };
    rarity: string;
    requirements: string;
    source: I5eItemSourceRef;
    type: { value: string; baseItem: string };
    unidentified: { description: string };
    uses: I5eSystemLimitedUses;
    weight: I5eItemWeight;
  }

  export interface I5eWeaponItem extends I5eSystemBaseDocumentData {
    type: "weapon";
    system: I5eWeaponSystemData;
    flags: IItemFlagConfig & {
      monsterMunch?: I5eMonsterMunchItemFlags;
      midiProperties?: I5eMidiItemProperties;
    };
  }

  // ---- Feat item ------------------------------------------------------------

  export interface I5eFeatSystemData {
    activities: Record<string, I5eActivity>;
    advancement?: I5eAdvancement[];
    crewed: boolean;
    description: I5eItemDescription;
    enchant: Record<string, any>;
    identifier: string;
    prerequisites: { items: any[]; repeatable: boolean };
    proficient?: boolean;
    properties: string[];
    requirements: string;
    source: I5eItemSourceRef;
    type: { value: string; subtype: string };
    uses: I5eSystemLimitedUses;
  }

  export interface I5eFeatItem extends I5eSystemBaseDocumentData {
    type: "feat";
    system: I5eFeatSystemData;
    flags: IItemFlagConfig & {
      monsterMunch?: I5eMonsterMunchItemFlags;
      midiProperties?: I5eMidiItemProperties;
    };
  }

  // ---- Spell item -----------------------------------------------------------

  export interface I5eSpellMaterials {
    value: string;
    consumed: boolean;
    cost: number;
    supply: number;
  }

  export interface I5eSpellSystemData {
    activation: { type: string; value: number; condition: string };
    activities: Record<string, I5eActivity>;
    description: I5eItemDescription;
    duration: { value: string; units: string };
    identifier: string;
    level: number;
    materials: I5eSpellMaterials;
    method: "atwill" | "innate" | "spell" | string;
    prepared: number;
    properties: string[];
    range: { value?: string; units: string; special?: string };
    school: string;
    source: I5eItemSourceRef;
    target: {
      affects: { count: string; type: string; choice?: boolean; special?: string };
      template: {
        count?: string;
        contiguous?: boolean;
        type: string;
        size?: string;
        width?: string;
        height?: string;
        units?: string;
      };
    };
    uses: I5eSystemLimitedUses;
  }

  export interface I5eSpellItem extends I5eSystemBaseDocumentData {
    type: "spell";
    system: I5eSpellSystemData;
    flags: IItemFlagConfig & {
      ddbimporter?: { dndbeyond: IParseSpellFlagDataDnDBeyond };
      "midi-qol"?: { removeAttackDamageButtons?: string };
      midiProperties?: I5eMidiItemProperties;
      "spell-class-filter-for-5e"?: Record<string, any>;
      "tidy5e-sheet"?: Record<string, any>;
    };
  }

  // ---- Equipment item -------------------------------------------------------

  export interface I5eEquipmentSystemData {
    activities: Record<string, I5eActivity>;
    armor: { value: number | null; dex: number | null };
    attuned: boolean;
    attunement: string;
    container: string | null;
    crew: { value: any[] };
    description: I5eItemDescription;
    equipped: boolean;
    identified: boolean;
    identifier: string;
    price: I5ePrice;
    proficient: boolean | null;
    properties: string[];
    quantity: number;
    rarity: string;
    source: I5eItemSourceRef;
    strength: number;
    type: { value: string; baseItem: string };
    unidentified: { description: string };
    uses: I5eSystemLimitedUses;
    weight: I5eItemWeight;
  }

  export interface I5eEquipmentItem extends I5eSystemBaseDocumentData {
    type: "equipment";
    system: I5eEquipmentSystemData;
    flags: IItemFlagConfig & {
      infusions?: { maps: any[]; applied: any[]; infused: boolean };
      midiProperties?: I5eMidiItemProperties;
    };
  }

  // ---- Container item -------------------------------------------------------

  export interface I5eContainerCapacityWeight {
    value?: number;
    units?: string;
  }

  export interface I5eContainerCapacityVolume {
    units?: string;
  }

  export interface I5eContainerCapacity {
    weight?: I5eContainerCapacityWeight;
    volume?: I5eContainerCapacityVolume;
  }

  export interface I5eContainerSystemData {
    description: I5eItemDescription;
    identifier: string;
    source: I5eItemSourceRef;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: string;
    attunement: string;
    currency: I5eCurrency;
    capacity: I5eContainerCapacity;
    properties: string[];
    attuned: boolean;
    equipped: boolean;
  }

  export interface I5eContainerItem extends I5eSystemBaseDocumentData {
    type: "container";
    system: I5eContainerSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Tool item ------------------------------------------------------------

  export interface I5eToolSystemData {
    activities: Record<string, I5eActivity>;
    uses: I5eSystemLimitedUses;
    description: I5eItemDescription;
    identifier: string;
    source: I5eItemSourceRef;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: string;
    attunement: string;
    ability: string;
    bonus: string;
    chatFlavor: string;
    proficient: number;
    properties: string[];
    type: { value: string; baseItem: string };
    attuned: boolean;
    equipped: boolean;
  }

  export interface I5eToolItem  extends I5eSystemBaseDocumentData {
    type: "tool";
    system: I5eToolSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Item union ---------------------------------------------------

  export type I5eMonsterItem =
    | I5eWeaponItem
    | I5eFeatItem
    | I5eSpellItem
    | I5eEquipmentItem
    | I5eContainerItem
    | I5eToolItem;

  // ---- Top-level NPC document -----------------------------------------------

  export interface I5eMonsterData extends I5eSystemBaseDocumentData {
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

  export interface I5ePCHitPoints {
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

  export interface I5ePCAttributes {
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

  export interface I5ePCResource {
    value?: number;
    max?: number;
    sr?: boolean;
    lr?: boolean;
    label?: string;
  }

  export interface I5ePCResources {
    primary?: I5ePCResource;
    secondary?: I5ePCResource;
    tertiary?: I5ePCResource;
  }

  // ---- PC Details -----------------------------------------------------------

  export interface I5ePCDetails {
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

  export interface I5ePCBastion {
    name?: string;
    description?: string;
  }

  // ---- PC System Data -------------------------------------------------------

  export interface I5ePCSystemData {
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

  export interface I5eClassHitDice {
    denomination?: string;
    spent?: number;
    additional?: string;
  }

  export interface I5eClassSpellcasting {
    progression?: "full" | "half" | "third" | "pact" | null;
    preparation?: {
      formula?: string;[];
    };
    ability?: "str" | "dex" | "con" | "int" | "wis" | "cha" | null;
  }

  export interface I5eClassPrimaryAbility {
    value?: ("str" | "dex" | "con" | "int" | "wis" | "cha")[];
    all?: boolean;
  }

  export interface I5eClassStartingEquipment {
    type?: string;
    _id?: string;
    group?: string;
    sort?: number;
    requiresProficiency?: boolean;
    count?: number | null;
    key?: string;
  }

  export interface I5eClassSystemData {
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

  export interface I5eClassItem extends I5eSystemBaseDocumentData {
    type: "class";
    system: I5eClassSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Subclass item --------------------------------------------------------

  export interface I5eSubclassSystemData {
    advancement?: I5eAdvancement[];
    classIdentifier?: string;
    description?: I5eItemDescription;
    identifier?: string;
    source?: I5eItemSourceRef;
    spellcasting?: I5eClassSpellcasting;
  }

  export interface I5eSubclassItem extends I5eSystemBaseDocumentData {
    type: "subclass";
    system: I5eSubclassSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Race item ------------------------------------------------------------

  export interface I5eRaceSystemData {
    advancement?: I5eAdvancement[];
    description?: I5eItemDescription;
    identifier?: string;
    movement?: I5eMovement;
    senses?: I5eSenses;
    source?: I5eItemSourceRef;
    type?: I5eCreatureType;
  }

  export interface I5eRaceItem extends I5eSystemBaseDocumentData {
    type: "race";
    system: I5eRaceSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Background item ------------------------------------------------------

  export interface I5eBackgroundSystemData {
    advancement?: I5eAdvancement[];
    description?: I5eItemDescription;
    identifier?: string;
    source?: I5eItemSourceRef;
    startingEquipment?: I5eClassStartingEquipment[];
  }

  export interface I5eBackgroundItem extends I5eSystemBaseDocumentData {
    type: "background";
    system: I5eBackgroundSystemData;
    flags: IItemFlagConfig & {
      dnd5e?: { advancementOrigin?: string };
    };
  }

  // ---- PC item union --------------------------------------------------------

  export type I5eClassItems = I5eClassItem | I5eSubclassItem;

  export type I5ePCItem =
    | I5eClassItems
    | I5eRaceItem
    | I5eBackgroundItem
    | I5eFeatItem
    | I5eSpellItem
    | I5eInventoryItem;

  export type I5eInventoryItem =
    | I5eWeaponItem
    | I5eEquipmentItem
    | I5eContainerItem
    | I5eToolItem;

  export type I5eFeatureItem =
    | I5eFeatItem
    | I5eWeaponItem;

  // ---- PC DDB Importer flags ------------------------------------------------

  export interface IDDBPCDnDBeyondCampaignCharacterFlags {
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

  export interface IDDBPCDnDBeyondCampaignFlags {
    id?: number;
    name?: string;
    description?: string;
    link?: string;
    publicNotes?: string;
    dmUserId?: number;
    dmUsername?: string;
    characters?: IDDBPCDnDBeyondCampaignCharacterFlags[];
  }

  export interface IDDBPCDnDBeyondFlags {
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

  export interface IDDBPCAutoAC {
    flat?: number | null;
    calc?: string;
    formula?: string;
  }

  export interface IDDBPCImporterFlags {
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
  export interface I5ePCDnd5eFlags {
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

  export interface I5ePCActorFlags {
    ddbimporter?: IDDBPCImporterFlags;
    dnd5e?: I5ePCDnd5eFlags;
    "midi-qol"?: { onUseMacroName?: string; [key: string]: any };
    "tidy5e-sheet"?: { maxPreparedSpells?: number; [key: string]: any };
    "tidy5e-sheet-kgar"?: Record<string, any>;
    "ddb-importer"?: Record<string, any>;
  }

  // ---- Top-level PC document ------------------------------------------------

  export interface I5ePCData extends I5eSystemBaseDocumentData {
    type: "character";
    system: I5ePCSystemData;
    items: I5ePCItem[];
    flags?: I5ePCActorFlags;
    prototypeToken?: I5ePrototypeToken;
  }

  export type I5eActorData = I5eMonsterData | I5ePCData;
}
