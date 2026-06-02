export {};

global {
  // Flags attached to folders built by NativeFolderBuilder.makeFolder.
  // Note: these live under `ddb`, not `ddbimporter`.
  interface INativeFolderDdbFlags {
    cobaltId: number | null;
    bookCode: string;
    // Present only on the per-book master folders (specialType set).
    ddbId?: number | null;
    specialType?: string;
  }

  interface INativeFolderFlags {
    ddb: INativeFolderDdbFlags;
    // Present only on the per-book master folders (specialType set).
    importid?: string;
  }

  interface I5eFolderData {
    _id?: string;
    name: string;
    type: string;
    folder?: string | null;
    sort?: number;
    sorting?: "m" | "a";
    color: string;
    flags?: INativeFolderFlags;
  }
}
