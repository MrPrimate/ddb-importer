export {};

global {

  type distanceUnitTypes = "" | "ft" | "mi" | "self" | "touch" | "spec" | "any";

  type activationCostType = "none"
    | "action"
    | "bonus"
    | "reaction"
    | "minute"
    | "hour"
    | "day"
    | "longRest"
    | "shortRest"
    | "encounter"
    | "turnStart"
    | "turnEnd"
    | "legendary"
    | "mythic"
    | "lair"
    | "crew"
    | "special";

  type targetType = ""
    | "ally"
    | "any"
    | "creature"
    | "creatureOrObject"
    | "enemy"
    | "object"
    | "self"
    | "space"
    | "willing";

  type templateType = ""
    | "circle"
    | "cone"
    | "cube"
    | "cylinder"
    | "radius"
    | "line"
    | "sphere"
    | "square"
    | "wall";

  type durationUnitTypes = "" | "inst" | "spec" | "disp" | "dstr" | "perm" | "turn" | "round" | "minute" | "hour" | "day" | "month" | "year";

  type actorSizes = "tiny" | "sm" | "med" | "lg" | "huge" | "grg";

  type creatureTypes = "aberration" | "beast" | "celestial" | "construct" | "dragon" | "elemental" | "fey" | "fiend" | "giant" | "humanoid" | "monstrosity" | "ooze" | "plant" | "undead";

  type weaponPropertiesType = "ada" | "amm" | "fin" | "fir" | "foc" | "hvy" | "lgt" | "lod" | "mgc" | "rch" | "rel" | "ret" | "sil" | "spc" | "thr" | "two" | "ver" | "burstfire" | "hafted" | "momentum" | "armorpiercing" | "blackpowder" | "cumbersome" | "magazine" | "repeater" | "double" | "damage";

  type consumablePropertiesType = "mgc";

  type containerPropertiesType = "mgc" | "weightlessContents";

  type equipmentPropertiesType = "ada" | "foc" | "mgc" | "stealthDisadvantage";

  type spellPropertiesType = "vocal" | "somatic" | "material" | "concentration" | "ritual";

  type toolPropertiesType = "foc" | "mgc";

  type featPropertiesType = "mgc" | "trait";

  interface I5eSystemBaseDocumentData {
    _id?: string;
    name: string;
    type: string;
    img?: string;
    flags?: Record<string, any>;
    effects: IEffectData[];
    folder?: string | null;
    sort?: number;
    ownership?: Record<string, number>;
    _stats?: I5eDocumentStats;
  }

  interface I5eDocumentStats {
    systemId?: string;
    systemVersion?: string;
    coreVersion?: string;
    compendiumSource?: string | null;
    duplicateSource?: string | null;
    exportSource?: string | null;
    lastModifiedBy?: string | null;
  }

    // ---- Source ---------------------------------------------------------------
  interface I5eSourceInfo {
    book?: string;
    custom?: string;
    id?: number;
    license?: string;
    page?: string;
    rules?: string;
    sourceCategoryId?: number;
  }

  // ---- Damage parts ---------------------------------------------------------

  interface I5eDamageScaling {
    mode?: string;
    number?: number | null;
    formula?: string;
  }

  interface I5eDamageCustom {
    enabled: boolean;
    formula: string;
  }

  export type I5eDamageType = "acid" | "bludgeoning" | "cold" | "fire" | "force" | "lightning" | "necrotic" | "piercing" | "poison" | "psychic" | "radiant" | "slashing" | "thunder" | string;

  interface I5eDamagePart {
    number: number;
    denomination: number;
    bonus: string;
    types: I5eDamageType[];
    custom?: I5eDamageCustom;
    scaling?: I5eDamageScaling;
  }

}
