import SETTINGS from '../../settings.js';
import CompendiumHelper from '../../lib/CompendiumHelper.js';

export default async function () {
  if (game.settings.get(SETTINGS.MODULE_ID, "auto-create-compendium")) {
    for (const compendium of SETTINGS.COMPENDIUMS) {
      const compendiumName = game.settings.get(SETTINGS.MODULE_ID, compendium.setting);
      const compendiumData = { id: compendiumName, type: compendium.type, label: `DDB ${compendium.title}` };
      // eslint-disable-next-line no-await-in-loop
      const result = await CompendiumHelper.createIfNotExists(compendiumData);

      if (result.created) {
        // eslint-disable-next-line no-await-in-loop
        await game.settings.set(SETTINGS.MODULE_ID, compendium.setting, result.compendium.metadata.id);
      }
    };
  }
}
