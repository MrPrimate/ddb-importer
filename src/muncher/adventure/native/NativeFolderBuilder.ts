import NativeIdFactory from "./NativeIdFactory";

const SCENE_FOLDER_SORT = 4000;

/**
 * Assemble a deterministic Folder doc. Callers compute the `_id` (the makeKey
 * args differ per folder); this owns the shared `{ sorting: "m", color: "" }`
 * boilerplate and the `ddb` flags shape.
 *
 * `specialType` marks the per-book master folders: they additionally carry
 * `importid` and a `ddbId` mirroring `cobaltId` (matches FolderFactory's base
 * folders). Chapter/named subfolders pass only `{ cobaltId, bookCode }`.
 */
export function makeFolderData(args: {
  _id: string;
  name: string;
  type: string;
  cobaltId: number | null;
  bookCode: string;
  folder?: string | null;
  sort?: number;
  specialType?: string;
}): I5eFolderData {
  const { _id, name, type, cobaltId, bookCode, folder = null, sort = SCENE_FOLDER_SORT, specialType } = args;
  const ddb: INativeFolderDdbFlags = { cobaltId, bookCode };
  const doc: I5eFolderData = { _id, name, type, folder, sort, sorting: "m", color: "", flags: { ddb } };
  if (specialType) {
    ddb.ddbId = cobaltId;
    ddb.specialType = specialType;
    doc.flags.importid = _id;
  }
  return doc;
}

/**
 * Builds the single master JournalEntry folder for a book.
 *
 * The muncher creates per-type master folders and discards journal subfolders,
 * placing every journal in the top-level master folder ("we discard folders for
 * journals and use top level" - FolderFactory.js). For the journals slice we
 * only need that one folder.
 */
export function buildMasterJournalFolder(
  idFactory: NativeIdFactory,
  bookCode: string,
  bookName: string,
): I5eFolderData {
  const _id = idFactory.getId(NativeIdFactory.makeKey({
    docType: "Folder",
    ddbId: -1,
    cobaltId: -1,
    name: bookName,
  }));

  return makeFolderData({ _id, name: bookName, type: "JournalEntry", cobaltId: -1, bookCode, specialType: "base" });
}

/** Master Scene folder for a book - sibling to the master JournalEntry folder. */
export function buildMasterSceneFolder(
  idFactory: NativeIdFactory,
  bookCode: string,
  bookName: string,
): I5eFolderData {
  const _id = idFactory.getId(NativeIdFactory.makeKey({
    docType: "Folder",
    ddbId: -2,
    cobaltId: -2,
    name: `Scene:${bookName}`,
  }));

  return makeFolderData({ _id, name: bookName, type: "Scene", cobaltId: -2, bookCode, specialType: "base" });
}

/** Per-chapter Scene subfolder under the master scene folder. */
export function buildSceneChapterFolder(
  idFactory: NativeIdFactory,
  masterId: string,
  bookCode: string,
  chapterKey: number,
  chapterName: string,
): I5eFolderData {
  const _id = idFactory.getId(NativeIdFactory.makeKey({
    docType: "Folder",
    cobaltId: -2,
    name: `Scene:${bookCode}:chapter:${chapterKey}`,
  }));

  return makeFolderData({
    _id, name: chapterName, type: "Scene", cobaltId: chapterKey, bookCode,
    folder: masterId, sort: SCENE_FOLDER_SORT + chapterKey,
  });
}
