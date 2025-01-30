

export function getArcaneSwords(arcaneSword) {
  const jb2aMod = game.modules.get('jb2a_patreon')?.active
    ? "jb2a_patreon"
    : "JB2A_DnD5e";
  const results = {};

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
      "prototypeToken.texture.src": `modules/${jb2aMod}/Library/2nd_Level/Spiritual_Weapon/SpiritualWeapon_Shortsword01_01_Astral_Blue_400x400.webm`,
      "img": `modules/${jb2aMod}/Library/2nd_Level/Spiritual_Weapon/SpiritualWeapon_Shortsword01_01_Astral_Blue_Thumb.webp`,
    }),
  };

  return results;
}
