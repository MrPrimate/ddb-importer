import SETTINGS from '../../settings.js';
import CompendiumHelper from '../../lib/CompendiumHelper.js';
import utils from '../../lib/utils.js';

export default async function () {
  if (game.settings.get(SETTINGS.MODULE_ID, "auto-create-compendium")) {
    for (const compendium of SETTINGS.COMPENDIUMS) {
      const compendiumName = game.settings.get(SETTINGS.MODULE_ID, compendium.setting);
      const compendiumData = { id: compendiumName, type: compendium.type, label: `DDB ${compendium.title}` };

      const createCompendiumFolder = isNewerVersion(game.version, 11)
        && game.settings.get(SETTINGS.MODULE_ID, "top-level-compendium-folder");
      const compendiumFolder = createCompendiumFolder
        // eslint-disable-next-line no-await-in-loop
        ? await utils.getFolder("compendium", "", "D&D Beyond", "#6f0006", "#98020a", false)
        : null;
      if (createCompendiumFolder) compendiumData.folder = compendiumFolder._id;

      // eslint-disable-next-line no-await-in-loop
      const result = await CompendiumHelper.createIfNotExists(compendiumData);

      if (result.created) {
        // eslint-disable-next-line no-await-in-loop
        await game.settings.set(SETTINGS.MODULE_ID, compendium.setting, result.compendium.metadata.id);
      } else if (result.compendium?.folder === null && createCompendiumFolder) {
        result.compendium.configure({ folder: compendiumFolder._id });
      }
    };
  }
}
