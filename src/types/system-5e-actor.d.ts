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

  export interface IMonsterAbilityScore {
    value?: number;
    proficient?: number;
    max?: number | null;
    mod?: number;
    /** When proficient, overwritten to a computed number; otherwise Foundry default roll config. */
    save?: number | I5eAbilitySaveConfig;
    dc?: number;
    check?: I5eAbilityCheckConfig;
    bonuses?: I5eAbilityBonuses;
    /** Set when proficient — proficiency bonus value. */
    prof?: number;
    /** Set when proficient — additional save bonus from source data. */
    saveBonus?: number;
  }

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

  export type IMonsterAbilities = Record<string, IMonsterAbilityScore>;

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

  export interface I5eResources {
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
    abilities?: IMonsterAbilities;
    attributes?: I5eAttributes;
    bonuses?: I5eBonuses;
    currency?: I5eCurrency;
    details?: I5eDetails;
    identifier?: string;
    resources?: I5eResources;
    skills?: I5eSkills;
    source?: I5eSourceInfo;
    spells?: I5eSpellSlots;
    tools?: Record<string, any>;
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

  // ---- Weapon item ----------------------------------------------------------

  export interface I5eWeaponSystemData {
    activities: Record<string, I5eActivity>;
    advancement: any[];
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

  export interface I5eWeaponItem {
    _id: string;
    name: string;
    type: "weapon";
    system: I5eWeaponSystemData;
    effects: IEffectData[];
    flags: IItemFlagConfig & {
      monsterMunch?: I5eMonsterMunchItemFlags;
      midiProperties?: I5eMidiItemProperties;
    };
    sort: number;
    img: string;
  }

  // ---- Feat item ------------------------------------------------------------

  export interface I5eFeatSystemData {
    activities: Record<string, I5eActivity>;
    advancement: any[];
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

  export interface I5eFeatItem {
    _id: string;
    name: string;
    type: "feat";
    system: I5eFeatSystemData;
    effects: IEffectData[];
    flags: IItemFlagConfig & {
      monsterMunch?: I5eMonsterMunchItemFlags;
      midiProperties?: I5eMidiItemProperties;
    };
    sort: number;
    img: string;
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

  export interface I5eSpellItem {
    _id: string;
    name: string;
    type: "spell";
    system: I5eSpellSystemData;
    effects: IEffectData[];
    flags: IItemFlagConfig & {
      "midi-qol"?: { removeAttackDamageButtons?: string };
      midiProperties?: I5eMidiItemProperties;
      "spell-class-filter-for-5e"?: Record<string, any>;
      "tidy5e-sheet"?: Record<string, any>;
    };
    sort?: number;
    img: string;
    folder?: string | null;
    _stats?: I5eDocumentStats;
    ownership?: Record<string, number>;
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

  export interface I5eEquipmentItem {
    _id: string;
    name: string;
    type: "equipment";
    system: I5eEquipmentSystemData;
    effects: IEffectData[];
    flags: IItemFlagConfig & {
      infusions?: { maps: any[]; applied: any[]; infused: boolean };
      midiProperties?: I5eMidiItemProperties;
    };
    sort?: number;
    img: string;
    _stats?: I5eDocumentStats;
    ownership?: Record<string, number>;
  }

  // ---- Container item -------------------------------------------------------

  export interface I5eContainerItem {
    _id: string;
    name: string;
    type: "container";
    system: Record<string, any>;
    effects: IEffectData[];
    flags: IItemFlagConfig;
    sort?: number;
    img: string;
  }

  // ---- Tool item ------------------------------------------------------------

  export interface I5eToolItem {
    _id: string;
    name: string;
    type: "tool";
    system: Record<string, any>;
    effects: IEffectData[];
    flags: IItemFlagConfig;
    sort?: number;
    img: string;
  }

  // ---- Monster item union ---------------------------------------------------

  export type I5eMonsterItem =
    | I5eWeaponItem
    | I5eFeatItem
    | I5eSpellItem
    | I5eEquipmentItem
    | I5eContainerItem
    | I5eToolItem;

  // ---- Top-level NPC document -----------------------------------------------

  export interface I5eMonsterData {
    _id?: string;
    name: string;
    type: "npc";
    system: I5eMonsterSystemData;
    img?: string;
    items: I5eMonsterItem[];
    flags?: IActorFlagConfig & { monsterMunch?: IMonsterMunchFlags };
    effects: IEffectData[];
    folder?: string | null;
    sort?: number;
    ownership?: Record<string, number>;
    prototypeToken?: I5ePrototypeToken;
    _stats?: I5eDocumentStats;
  }
}
