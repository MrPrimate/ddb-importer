import { utils } from "../../../lib/_module.mjs";
import { SRDExtractor } from "../SRDExtractor.mjs";

export async function getArcaneSwords() {
  const results = {};

  const pack = game.packs.get("dnd5e.monsters");
  if (!pack) return results;

  const arcaneSword = await SRDExtractor.getCompendiumDocument({ pack, name: "Arcane Sword" });
  if (!arcaneSword) return results;

  results["ArcaneSwordSpectralGreen"] = {
    name: "Arcane Sword (Spectral Green)",
    version: "1",
    required: null,
    isJB2A: true,
    needsJB2A: false,
    folderName: "Arcane Sword",
    data: foundry.utils.mergeObject(arcaneSword.toObject(), {
      "name": "Arcane Sword (Spectral Green)",
      "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/SpiritualWeapon_Shortsword01_02_Spectral_Green_400x400.webm",
      "img": "modules/ddb-importer/img/jb2a/SpiritualWeapon_Shortsword01_02_Spectral_Green_Thumb.webp",
    }),
  };

  results["ArcaneSwordAstralBlue"] = {
    name: "Arcane Sword (Astral Blue)",
    version: "1",
    required: null,
    isJB2A: true,
    needsJB2A: true,
    needsJB2APatreon: true,
    folderName: "Arcane Sword",
    data: foundry.utils.mergeObject(arcaneSword.toObject(), {
      "name": "Arcane Sword (Astral Blue)",
      "prototypeToken.texture.src": `${utils.getJB2APath()}/Library/2nd_Level/Spiritual_Weapon/SpiritualWeapon_Shortsword01_01_Astral_Blue_400x400.webm`,
      "img": `${utils.getJB2APath()}/Library/2nd_Level/Spiritual_Weapon/SpiritualWeapon_Shortsword01_01_Astral_Blue_Thumb.webp`,
    }),
  };

  return results;
}
