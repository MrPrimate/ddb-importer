import { SETTINGS } from '../../config/_module.mjs';
import { CompendiumHelper, FolderHelper } from '../../lib/_module.mjs';


export async function createDDBCompendium(compendiumSetting) {
  const compendiumName = game.settings.get(SETTINGS.MODULE_ID, compendiumSetting.setting);
  const compendiumData = {
    id: compendiumName,
    type: compendiumSetting.type,
    label: `DDB ${compendiumSetting.title}`,
    image: compendiumSetting.image,
    dnd5eTypeTags: compendiumSetting.types,
    version: compendiumSetting.version,
  };

  const createCompendiumFolder = game.settings.get(SETTINGS.MODULE_ID, "top-level-compendium-folder");
  const compendiumFolder = createCompendiumFolder
    ? await FolderHelper.getFolder("compendium", "", "D&D Beyond", "#6f0006", "#98020a", false)
    : null;
  if (createCompendiumFolder) compendiumData.folder = compendiumFolder._id;
  const result = await CompendiumHelper.createIfNotExists(compendiumData);

  if (result.created) {
    await game.settings.set(SETTINGS.MODULE_ID, compendiumSetting.setting, result.compendium.metadata.id);
  } else if (result.compendium?.folder === null && createCompendiumFolder) {
    result.compendium.configure({ folder: compendiumFolder._id });
  }
}

export default async function () {
  if (game.settings.get(SETTINGS.MODULE_ID, "auto-create-compendium")) {
    for (const compendium of SETTINGS.COMPENDIUMS.filter((c) => c.auto)) {
      await createDDBCompendium(compendium);
    }
  }
}
