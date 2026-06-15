export {};

global {
  /** ddb-importer's own table flags (foundry `flags.ddbimporter`). */
  interface I5eTableDDBImporterFlags extends IDDBImporterFlags {
    /** name of the feature/section the table was parsed out of. */
    parentName?: string;
    /** source book code/abbreviation. */
    sourceBook?: string;
    /** all parsed column keys (result + dice columns). */
    keys?: string[];
    /** the dice (roll) column keys among `keys`. */
    diceKeys?: string[];
  }

  /**
   * DDB provenance flags (foundry `flags.ddb`) emitted by `buildDdbFlags`.
   * `cobaltId`/`parentId` are omitted when null/undefined.
   */
  interface I5eTableDDBFlags {
    ddbId: number;
    bookCode: string;
    slug?: string | null;
    contentChunkId?: string | null;
    cobaltId?: number;
    parentId?: number;
  }

  /**
   * One row of a parsed HTML table (return element of `parseTable`).
   * Keys are the column headings (`<thead>` cell text); values are the cell's
   * `innerHTML`, or a `boolean` when the cell holds a checkbox input.
   */
  type I5eParsedTableRow = Record<string, string | boolean>;

  /** Return type of `parseTable(node)`  one entry per table body row. */
  type I5eParsedTable = I5eParsedTableRow[];

  interface I5eTableResult {
    description?: string;
    img?: string;
    resultId?: string | null;
    weight?: number;
    range?: number[];
    drawn?: boolean;
    resultCollection?: string;
  }

  interface I5eTableData extends RollTable.CreateData {
    _id?: string;
    name?: string;
    sort?: number;
    img?: string;
    description?: string;
    results?: I5eTableResult[];
    formula?: string;
    replacement?: boolean;
    displayRoll?: boolean;
    type?: string;
    folder?: string;
    ownership?: { default: number };
    _stats?: Partial<RollTable["_stats"]>;
    flags?: {
      ddbimporter?: I5eTableDDBImporterFlags;
      ddb?: I5eTableDDBFlags;
    };
  }
}
