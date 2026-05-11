import { utils } from "./_module";

export default class FolderHelper {

  static async getOrCreateFolder (
    root,
    entityType,
    folderName,
    folderColor = "",
    options: { sort?: number | null; sortMode?: "a" | "m" } = {},
  ): Promise<Folder.Implementation> {
    let folder = game.folders.contents.find((f) =>
      f.type === entityType && f.name === folderName
      // if a root folder we want to match the root id for the parent folder
      && (root ? root.id : null) === (f.folder?.id ?? null),
    );
    if (folder) {
      // Existing folder - patch its sort if the caller asked for one and the
      // current value doesn't match. Keeps Map Browser-driven folder order
      // stable as new scenes get added.
      if (typeof options.sort === "number" && Number.isFinite(options.sort) && folder.sort !== options.sort) {
        try {
          await folder.update({ sort: options.sort, sorting: options.sortMode ?? "m" } as any);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) { /* tolerate failures - folder still usable */ }
      }
      return folder;
    }
    const folderData: any = {
      name: folderName,
      type: entityType,
      color: folderColor,
      folder: (root) ? (root._id ?? root.id) : null,
    };
    if (typeof options.sort === "number" && Number.isFinite(options.sort)) {
      folderData.sort = options.sort;
      // "m" = manual sort; required for the sort value to take effect over
      // alphabetical sibling sorting.
      folderData.sorting = options.sortMode ?? "m";
    }
    // @ts-expect-error - not sure if I'm wrong
    folder = await Folder.create(folderData as any, { displaySheet: false });
    return folder;
  }


  static async getFolder(kind, subFolder = "", baseFolderName = "D&D Beyond Import", baseColor = "#6f0006", subColor = "#98020a", typeFolder = true): Promise<Folder.Implementation> {
    const entityTypes = utils.entityMap();
    const folderName = game.i18n.localize(`ddb-importer.item-type.${kind}`);
    const entityType = entityTypes.get(kind);
    const baseFolder = await FolderHelper.getOrCreateFolder(null, entityType, baseFolderName, baseColor);
    const entityFolder = typeFolder
      ? await FolderHelper.getOrCreateFolder(baseFolder, entityType, folderName, subColor)
      : baseFolder;
    if (subFolder !== "") {
      const subFolderName = subFolder.charAt(0).toUpperCase() + subFolder.slice(1);
      const typeFolder = await FolderHelper.getOrCreateFolder(entityFolder, entityType, subFolderName, subColor);
      return typeFolder;
    } else {
      return entityFolder;
    }
  }

  /**
   * Retrieves the folder ID of a compendium with a given name within a specified compendium.
   *
   * @param {string} name The name of the folder to search for.
   * @param {string} compendiumName The name of the compendium to search within.
   * @returns {Promise<string|undefined>} The ID of the folder if found, otherwise undefined.
   */
  static async getCompendiumFolderId(name, compendiumName): Promise<string | undefined> {
    const compendium = game.packs.get(compendiumName);
    return compendium.folders.find((f) => f.name === name)?._id;
  }

}
