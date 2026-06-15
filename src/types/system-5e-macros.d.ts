export {};

global {

  interface I5eMacroDDBImporterFlags {
    /** marks a macro created by ddb-importer. */
    macro?: boolean;
  }

  interface I5eMacroFlags {
    "ddb-importer"?: I5eMacroDDBImporterFlags;
  }

  interface I5eMacroData {
    /** set only when updating an existing macro. */
    _id?: string;
    name?: string;
    /** DocumentTypeField; one of CONST.MACRO_TYPES ("chat" | "script"). */
    type?: string;
    /** FilePathField (IMAGE); defaults to `icons/svg/dice-target.svg`. */
    img?: string;
    /** one of CONST.MACRO_SCOPES ("global" | "actors" | "actor"). */
    scope?: string;
    /** the macro body. */
    command?: string;
    /** owning Folder id ("DDB Macros"), or undefined when temp. */
    folder?: string;
    sort?: number;
    /** ownership level map; builder sets `{ default: 0 | 2 }`. */
    ownership?: { default: number };
    flags?: I5eMacroFlags;
  }

}
