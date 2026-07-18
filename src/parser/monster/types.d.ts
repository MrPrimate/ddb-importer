export {};

global {
  interface AdjustmentsConfigCondition {
    id: number;
    name: string;
    type: number;
    slug: string;
  }

  type TAdjustmentsConfigResult = IDDBConfigDamageAdjustment[] | AdjustmentsConfigCondition[] | null;


  interface IMonsterSpellInnate {
    name: string;
    type: string;
    value: string | number | null;
    innate?: boolean;
    edge?: string;
    edgeDescription?: string;
  }

  interface IMonsterSpellEdgeCase {
    name: string;
    type: string;   // "atwill" | "class" | "pact" | "innate"
    edge: string;
    edgeDescription?: string;
  }

  interface IDDBMonsterSpellListTracker {
    atwill: string[];
    class: string[];
    pact: string[];
    innate: IMonsterSpellInnate[];
    edgeCases: IMonsterSpellEdgeCase[];
    material: boolean;
    innateMatch: boolean;
    concentration: boolean;
    overrideData?: DeepPartial<I5eSpellItem> | null;
  }

}
