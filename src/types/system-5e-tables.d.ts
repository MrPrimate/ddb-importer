export {};

global {
  // replace this when a ddb tables is revised
  interface I5eTableData extends RollTable.CreateData {
    type: string;
    flags?: {
      ddbimporter?: IDDBImporterFlags;
    };
  }
}
