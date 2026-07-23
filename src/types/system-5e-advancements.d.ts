export {};

global {

  // ---- Advancement types ----------------------------------------------------

  interface I5eAdvancementBase {
    _id?: string;
    type?: string;
    title?: string;
    hint?: string;
    level?: number;
    classRestriction?: "primary" | "secondary" | "";
    icon?: string | null;
  }

  interface I5eAdvancementPool { uuid: string };

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

  interface I5eAdvConfig {
    identifier?: string;
  }

  interface I5eAdvScaleValueConfig extends I5eAdvConfig {
    type?: I5eAdvScaleValueType;
    distance?: { units?: string };
    scale?: Record<string, I5eAdvScaleValueEntry>;
  }
  interface I5eAdvancementScaleValue extends I5eAdvancementBase {
    type?: "ScaleValue";
    configuration?: I5eAdvScaleValueConfig;
    value?: Record<string, never>;
  }

  interface I5eAdvItemGrantItem extends I5eAdvancementPool { optional?: boolean }
  interface I5eAdvItemGrantConfig {
    items?: I5eAdvItemGrantItem[];
    optional?: boolean;
    spell?: Record<string, any> | null;
    type?: string | null;
  }

  type I5eAdvancementItemGrantValueAdded = Record<string, string>;

  interface I5eAdvancementItemGrant extends I5eAdvancementBase {
    type?: "ItemGrant";
    configuration: I5eAdvItemGrantConfig;
    /** Keys are local item IDs; values are compendium UUIDs, populated after grant. */
    value?: { added?: I5eAdvancementItemGrantValueAdded };
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
    type?: "AbilityScoreImprovement";
    configuration?: I5eAdvASIConfig;
    value?: { type?: "asi" | "feat"; feat?: Record<string, string>; assignments?: Record<string, number> };
  }

  interface I5eAdvancementHitPoints extends I5eAdvancementBase {
    type?: "HitPoints";
    configuration?: Record<string, never>;
    /** Keys are level strings ("1"–"20"); values are "max", "avg", or a rolled number. */
    value?: Record<string, "max" | "avg" | number>;
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
    type?: "Trait";
    configuration?: I5eAdvTraitConfig;
    value?: { chosen?: string[] };
  }

  interface I5eAdvItemChoiceLevelConfig {
    count?: number | null;
    replacement?: boolean;
  }
  interface I5eAdvItemChoiceRestriction {
    type?: string;
    subtype?: string;
    list?: string[];
    level?: number | string | null;
  }

  type TI5eAdvItemChoiceConfigChoices = Record<string, I5eAdvItemChoiceLevelConfig>;

  interface I5eAdvItemChoiceConfig {
    choices?: TI5eAdvItemChoiceConfigChoices;
    allowDrops?: boolean;
    type?: string;
    pool?: I5eAdvancementPool[];
    spell?: Record<string, any> | null;
    restriction?: I5eAdvItemChoiceRestriction;
  }

  type I5eAdvancementItemChoiceValueAdded = Record<string, Record<string, string>>;

  interface I5eAdvancementItemChoice extends I5eAdvancementBase {
    type?: "ItemChoice";
    configuration: I5eAdvItemChoiceConfig;
    value?: {
      added?: I5eAdvancementItemChoiceValueAdded;
      replaced?: Record<string, string>;
    };
  }

  interface I5eAdvancementSubclass extends I5eAdvancementBase {
    type: "Subclass";
    configuration: Record<string, never>;
    value: { document?: any; uuid?: string | null };
  }

  interface I5eAdvancementSize extends I5eAdvancementBase {
    type: "Size";
    configuration: { sizes?: TActorSizes[] };
    value: { size?: TActorSizes };
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


}
