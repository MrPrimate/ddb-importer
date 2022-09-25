import SETTINGS from '../../settings.js';
import CompendiumHelper from '../../lib/CompendiumHelper.js';

export default async function () {
  const autoCreate = game.settings.get(SETTINGS.MODULE_ID, "auto-create-compendium");

  if (autoCreate) {
    SETTINGS.COMPENDIUMS.forEach((compendium) => {
      CompendiumHelper.createIfNotExists(compendium.setting, compendium.type, compendium.title);
    });
  }
}
