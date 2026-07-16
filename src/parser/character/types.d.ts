import { IDDBConditionMapping } from "../../config/dictionary/actor/conditions";

export {};

global {
  interface IDDBCasterInfo {
    name: string;
    casterLevel: number;
    slots: number[];
    cantrips: number;
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

}
