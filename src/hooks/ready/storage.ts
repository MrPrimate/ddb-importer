import { SETTINGS } from "../../config/_module";
import { CompendiumHelper, Iconizer } from "../../lib/_module";

export async function createStorage() {

  await Iconizer.getDDBSchoolSpellImages();
  await Iconizer.getDDBGenericLootImages();
  await Iconizer.getDDBGenericItemImages();

  for (const compendium of SETTINGS.COMPENDIUMS) {
    await CompendiumHelper.getCompendiumBannerImage(compendium.image, compendium.title);
  }

}
