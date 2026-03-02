export {};

global {

  // temp until replaced with 5e types
  export interface I5eSystemLimitedUsesRecovery {
    period: string;
    type: string;
    formula?: string | undefined;
  }

  export interface I5eSystemLimitedUses {
    spent?: number | null;
    max?: string | null;
    recovery?: I5eSystemLimitedUsesRecovery[];
    override?: boolean;
  }

  export interface I5eSystemBaseDocumentData {
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

}
