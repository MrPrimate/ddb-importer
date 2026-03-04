export {};

global {

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

}
