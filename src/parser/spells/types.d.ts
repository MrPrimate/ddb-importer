import type { IDDBSourceResponse } from "../../lib/DDBSources";

export {};

global {
  type TGrantedSpellTypeOrigins = "class" | "feat" | "race" | "background";

  // resolved source triple built by SpellListFactory.#buildSources from CONFIG.DDB.sources
  interface ISpellListSource {
    id: number;
    acronym: string;
    label: string;
  }

  // mapped spell entry stored by DDBSpellListFactory.extractClassSpellListData
  interface IDDBSpellListEntry {
    id: number;
    name: string;
    isLegacy: boolean;
    sources: IDDBSourceResponse[];
    sourceDefinition?: IDDBSource[];
    isHomebrew?: boolean;
  }
}
