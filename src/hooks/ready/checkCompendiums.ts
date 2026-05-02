import { SETTINGS } from "../../config/_module";
import { CompendiumHelper, FolderHelper, utils } from "../../lib/_module";


export async function createDDBCompendium(compendiumSetting): Promise<string> {
  const compendiumName = game.settings.get(SETTINGS.MODULE_ID, compendiumSetting.setting);
  const createCompendiumBanner = game.settings.get(SETTINGS.MODULE_ID, "ddb-compendium-banner");
  const compendiumData = {
    id: compendiumName,
    type: compendiumSetting.type,
    label: `DDB ${compendiumSetting.title}`,
    image: createCompendiumBanner
      ? compendiumSetting.image
      : null,
    dnd5eTypeTags: compendiumSetting.types,
    version: compendiumSetting.version,
    title: compendiumSetting.title,
    folderId: null,
  };

  const createCompendiumFolder = utils.getSetting<string>("top-level-compendium-folder");
  const compendiumFolder: Folder.Implementation | null = createCompendiumFolder
    ? await FolderHelper.getFolder("compendium", "", "D&D Beyond", "#6f0006", "#98020a", false)
    : null;
  if (createCompendiumFolder && compendiumFolder) compendiumData.folderId = compendiumFolder._id;
  const result = await CompendiumHelper.createIfNotExists(compendiumData);

  if (result.created) {
    await game.settings.set(SETTINGS.MODULE_ID, compendiumSetting.setting, result.compendium.metadata.id);
  } else if (result.compendium?.folder === null && createCompendiumFolder && compendiumFolder) {
    await result.compendium.setFolder(compendiumFolder._id);
  }

  return result.compendium.metadata.id;

}

export default async function () {
  const compendiums: string[] = [];
  if (game.settings.get(SETTINGS.MODULE_ID, "auto-create-compendium")) {
    for (const compendium of SETTINGS.COMPENDIUMS.filter((c) => c.auto)) {
      const compendiumId = await createDDBCompendium(compendium);
      compendiums.push(compendiumId);
    }
  }
  await Hooks.callAll("ddb-importer.compendiumCreationComplete", { compendiums });
}
