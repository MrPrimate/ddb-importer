export {};

global {

  interface I5eMacroDDBImporterFlags {
    /** marks a macro created by ddb-importer. */
    macro?: boolean;
  }

  interface I5eMacroFlags {
    "ddb-importer"?: I5eMacroDDBImporterFlags;
  }

  /**
   * The context object DDBMacros/midi-qol passes to ddb macro functions
   * (effects/auras and effects/macros modules).
   */
  interface IDDBMacroFunctionContext {
    speaker?: any;
    actor?: any;
    token?: any;
    character?: any;
    item?: any;
    rolledItem?: any;
    macroItem?: any;
    args?: any[];
    scope?: any;
    workflow?: any;
  }

  interface I5eMacroData {
    _id?: string;
    name?: string;
    type?: "chat" | "script";
    img?: string;
    scope?: "global" | "actors" | "actor";
    command?: string;
    folder?: string;
    sort?: number;
    /** ownership level map; builder sets `{ default: 0 | 2 }`. */
    ownership?: { default: number };
    flags?: I5eMacroFlags;
    uuid?: string;
  }

}
