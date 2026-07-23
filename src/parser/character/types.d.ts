import { IDDBConditionMapping } from "../../config/dictionary/actor/conditions";

export {};

global {
  interface IDDBCasterInfo {
    name: string;
    casterLevel: number;
    slots: number[];
    cantrips: number;
  }

  // The definition object built by generateBackground: the template's minimal
  // definition with a full IDDBBackgroundDefinition merged onto it. On the
  // fallback path it stays minimal, so the merged background-definition fields
  // are optional while the template core is required.
  type IDDBGeneratedBackgroundDefinition =
    Omit<Partial<IDDBBackgroundDefinition>, "id" | "entityTypeId" | "name" | "description" | "sources"> & {
      name: string;
      description: string;
      // injected by generateBackground (not present on the source definition)
      originalDescription: string | null;
      id: number | null;
      entityTypeId: number | null;
      sources: IDDBSource[] | null;
    };

  // Input to generateBackground: a real background definition, or a custom
  // background with isHomebrew injected by getBackgroundData. The builder reads
  // fields from whichever shape is present (each guarded by a truthy check), so
  // shared fields stay required while every shape-specific field is optional.
  type IDDBBackgroundInput =
    (IDDBBackgroundDefinition | IDDBCustomBackground)
    & Partial<IDDBBackgroundDefinition & IDDBCustomBackground>;

  // Result of DDBCharacter.getBackgroundData / generateBackground: a feature-like
  // wrapper consumed by CharacterFeatureFactory.getFeaturesFromDefinition.
  interface IDDBGeneratedBackground {
    name: string;
    description: string;
    id: number | null;
    entityTypeId: number | null;
    featuresId: number | null;
    featuresEntityTypeId: number | null;
    characteristicsId: number | null;
    characteristicsEntityTypeId: number | null;
    definition: IDDBGeneratedBackgroundDefinition;
  }

  interface IDDBConditionState extends IDDBConditionMapping {
    label: string;
    foundry: string;
    ddbId: number | null;
    levelId: number | null;
    ddbType: number | null;
    ddbCondition: boolean;
    applied: boolean;
    conditionApplied: ActiveEffect | I5eEffectData | undefined;
    needsAdd: boolean;
    needsRemove: boolean;
    needsUpdate: boolean;
  }

  interface IFilterAbilityModsOptions {
    restriction?: (string | null)[];
    includeExcludedEffects?: boolean;
    effectOnly?: boolean;
    classId?: any;
    availableToMulticlass?: any;
    useUnfilteredModifiers?: any;
  };

}
