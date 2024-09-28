import CompendiumHelper from "../../lib/CompendiumHelper.js";
import { DDBCompendiumFolders } from "../../lib/DDBCompendiumFolders.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import { addNPC } from "../../muncher/importMonster.js";


// KNOWN_ISSUE_4_0 fix up summon spells

const SUMMONS_ACTOR_STUB = {
  "type": "npc",
  "system": {
    "abilities": {
      "str": {
        "value": 100,
      },
      "dex": {
        "value": 100,
      },
      "con": {
        "value": 100,
      },
      "int": {
        "value": 100,
      },
      "wis": {
        "value": 100,
      },
      "cha": {
        "value": 100,
      },
    },
    "attributes": {
      "movement": {
        "burrow": null,
        "climb": null,
        "fly": null,
        "swim": null,
        "walk": null,
        "units": null,
        "hover": true,
      },
      "ac": {
        "flat": 1000,
        "calc": "flat",
      },
      "hp": {
        "value": 1000,
        "max": 1000,
        "temp": 0,
        "tempmax": 0,
        "bonuses": {},
      },
    },
    "traits": {
      "size": "tiny",
    },
  },
  "items": [],
  "effects": [],
  "folder": null,
  "prototypeToken": {
    "actorLink": false,
    "appendNumber": true,
    "prependAdjective": false,
    "width": 0.5,
    "height": 0.5,
    "texture": {
      "anchorX": 0.5,
      "anchorY": 0.5,
      "offsetX": 0,
      "offsetY": 0,
      "fit": "contain",
      "scaleX": 1,
      "scaleY": 1,
      "rotation": 0,
      "tint": "#ffffff",
      "alphaThreshold": 0.75,
    },
    "hexagonalShape": 0,
    "lockRotation": false,
    "rotation": 0,
    "alpha": 1,
    "disposition": CONST.TOKEN_DISPOSITIONS.SECRET,
    "displayBars": 0,
    "bar1": {
      "attribute": null,
    },
    "bar2": {
      "attribute": null,
    },
    "ring": {
      "enabled": false,
    },
    "randomImg": false,
  },
};

const DANCING_LIGHTS_BASE = {
  "name": "Dancing Lights",
  "img": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_Thumb.webp",
  "system": {
    "attributes": {
      "movement": {
        "fly": 60,
      },
    },
  },

  "prototypeToken": {
    "name": "Dancing Lights",
    "width": 0.5,
    "height": 0.5,
    "texture": {
      "src": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_200x200.webm",
    },
    "light": {
      "negative": false,
      "priority": 0,
      "alpha": 0.5,
      "angle": 360,
      "bright": 0,
      "color": null,
      "coloration": 1,
      "dim": 10,
      "attenuation": 0.5,
      "luminosity": 0.5,
      "saturation": 0,
      "contrast": 0,
      "shadows": 0,
      "animation": {
        "type": "torch",
        "speed": 3,
        "intensity": 3,
        "reverse": false,
      },
      "darkness": {
        "min": 0,
        "max": 1,
      },
    },
  },
};

// eslint-disable-next-line no-unused-vars
const ELRITCH_CANNON_ABILITY_STUB = {
  "id": 1,
  "entityTypeId": 1120657896,
  "limitedUse": null,
  "name": "",
  "description": "",
  "snippet": "",
  "abilityModifierStatId": 1,
  "saveStatId": null,
  "attackTypeRange": 1,
  "actionType": 1,
  "attackSubtype": 3,
  "dice": null,
  "value": null,
  "damageTypeId": 1,
  "isMartialArts": false,
  "isProficient": true,
  "spellRangeType": null,
  "displayAsAttack": null,
  "range": null,
  "activation": {
    "activationTime": 1,
    "activationType": 1,
  },
  "componentId": 0,
  "componentTypeId": 0,
};

const EXTRA_ARCANE_HAND_INSTANCES = (jb2aMod) => {
  return [
    { color: "Red", needsJB2A: false, token: "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_400x400.webm", actor: "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_Thumb.webp" },
    { color: "Purple", needsJB2A: true, token: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_400x400.webm`, actor: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_Thumb.webp` },
    { color: "Green", needsJB2A: true, token: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_400x400.webm`, actor: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_Thumb.webp` },
    { color: "Blue", needsJB2A: true, token: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_400x400.webm`, actor: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_Thumb.webp` },
    { color: "Rock", needsJB2A: true, needsJB2APatreon: true, token: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_400x400.webm`, actor: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_400x400.webm` },
    { color: "Rainbow", needsJB2A: true, needsJB2APatreon: true, token: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_400x400.webm`, actor: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_Thumb.webp` },
  ];
};

function getArcaneHands(arcaneHand, name = "Arcane Hand", postfix = "") {
  const jb2aMod = game.modules.get('jb2a_patreon')?.active
    ? "jb2a_patreon"
    : "JB2A_DnD5e";
  const results = {};

  const idString = utils.idString(name);

  EXTRA_ARCANE_HAND_INSTANCES(jb2aMod).forEach((data) => {

    const actorData = foundry.utils.mergeObject(foundry.utils.deepClone(arcaneHand), {
      "name": `${name} (${data.color})`,
      "prototypeToken.texture.src": data.token,
      "img": data.actor,
    });

    actorData.items.forEach((item) => {
      switch (item.name) {
        case "Clenched Fist": {
          item.img = "icons/magic/earth/strike-fist-stone.webp";
          break;
        }
        case "Forceful Hand": {
          item.img = "icons/magic/earth/strike-fist-stone-gray.webp";
          break;
        }
        case "Grasping Hand": {
          item.img = "icons/magic/earth/strike-fist-stone-light.webp";
          break;
        }
        case "Interposing Hand": {
          item.img = "icons/magic/earth/barrier-stone-explosion-debris.webp";
          break;
        }
        // no default
      }
    });

    results[`${idString}${data.color}${postfix}`] = {
      name: `${name} (${data.color})`,
      version: "2",
      required: null,
      isJB2A: true,
      needsJB2A: data.needsJB2A ?? false,
      needsJB2APatreon: data.needsJB2APatreon ?? false,
      folderName: name,
      data: actorData,
    };
  });

  return results;
}

async function get2024ArcaneHands({ text }) {
  // eslint-disable-next-line no-use-before-define
  const arcaneHand = await DDBSummonsManager.getSRDCompendiumDocument({ name: "Arcane Hand" });
  const arcaneHand2024 = arcaneHand.toObject();
  // add arcane hand 2024 descriptions and adjust damage

  arcaneHand2024.system.details.cr = null;
  // console.warn("2024 Arcane Hands", { arcaneHand, arcaneHand2024});

  const hands2024 = getArcaneHands(arcaneHand2024, "Bigby's Hand", "2024");

  const dom = utils.htmlToDocumentFragment(text);

  const descriptionUpdates = {};
  dom.querySelectorAll("p").forEach((node) => {
    const pDom = utils.htmlToDocumentFragment(node.outerHTML);
    const query = pDom.querySelector("strong");
    if (!query) return;
    let name = query.textContent.trim().replace(/\./g, '');
    descriptionUpdates[name] = {
      description: node.innerHTML.replace(query.outerHTML, "").trim(),
    };
  });

  Object.keys(hands2024).forEach((key) => {
    hands2024[key].data.items.forEach((item) => {
      const update = descriptionUpdates[item.name];
      if (update) {
        item.system.description.value = update.description;
      }
      switch (item.name) {
        case "Clenched Fist": {
          item.system.damage.base.custom.formula = "(2 * @flags.dnd5e.summon.level - 8)d8";
          break;
        }
        case "Grasping Hand": {
          item.system.description.value += `
<h3>Grapple Escape Tests</h3>
<p>[[/check ability=str skill=ath dc=8+@prof+@flags.dnd5e.summon.mod]]{Strength (Athletics)} [[/check ability=dex skill=acr dc=8+@prof+@flags.dnd5e.summon.mod]]{Dexterity (Acrobatics)}</p>`;
          for (const key of Object.keys(item.system.activities)) {
            const activity = item.system.activities[key];
            if (activity.type !== "damage") continue;
            activity.damage.parts[0].custom.formula = "(2 * @flags.dnd5e.summon.level - 6)d6 + @flags.dnd5e.summon.mod";
            item.system.activities[key] = activity;
          }
          break;
        }
        case "Forceful Hand":
        case "Interposing Hand":
        default: {
          // no adjustments
          break;
        }
      }
    });
  });

  return hands2024;
}


function getEldritchCannonStub(size) {
  const cannon = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
    name: "Eldritch Cannon",
    img: "icons/weapons/guns/gun-blunderbuss-gold.webp",
    system: {
      "abilities": {
        "str": {
          "value": 10,
        },
        "dex": {
          "value": 10,
        },
        "con": {
          "value": 10,
        },
        "int": {
          "value": 10,
        },
        "wis": {
          "value": 10,
        },
        "cha": {
          "value": 10,
        },
      },
      "attributes": {
        "movement": {
          "burrow": null,
          "climb": null,
          "fly": null,
          "swim": null,
          "walk": null,
          "units": null,
          "hover": true,
        },
        "ac": {
          "flat": 18,
          "calc": "flat",
        },
        "hp": {
          "value": 1,
          "max": 1,
        },
      },
      "traits": {
        "size": size,
      },
    },
    "prototypeToken": {
      "name": "Eldritch Cannon",
      "width": 0.5,
      "height": 0.5,
      "texture": {
        "src": "icons/weapons/guns/gun-blunderbuss-gold.webp",
      },
    },
  });
  return cannon;
}

function getArcaneSwords(arcaneSword) {
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

function getHoundOfIllOmen(direWolf, version) {
  const results = {};

  if (direWolf) {
    results["HoundOfIllOmen"] = {
      name: "Hound of Ill Omen",
      version: `${version}`,
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Shadow Sorcerer",
      data: foundry.utils.mergeObject(direWolf.toObject(), {
        "name": "Hound of Ill Omen",
        "prototypeToken": {
          name: "Hound of Ill Omen",
          width: 1,
          height: 1,
        },
        "prototypeToken.name": "Hound of Ill Omen",
        "system.traits.size": "med",
      }),
    };
  }

  return results;

}

async function getSRDActors() {
  const results = {};
  const pack = game.packs.get("dnd5e.monsters");
  if (!pack) return results;
  const dddCompendium = CompendiumHelper.getCompendiumType("monster", false);

  // eslint-disable-next-line no-use-before-define
  const arcaneHand = await DDBSummonsManager.getSRDCompendiumDocument({ pack, name: "Arcane Hand" });
  if (arcaneHand) {
    foundry.utils.mergeObject(results, getArcaneHands(arcaneHand.toObject()));
  }

  // eslint-disable-next-line no-use-before-define
  const arcaneSword = await DDBSummonsManager.getSRDCompendiumDocument({ pack, name: "Arcane Sword" });
  if (arcaneHand) {
    foundry.utils.mergeObject(results, getArcaneSwords(arcaneSword));
  }

  // eslint-disable-next-line no-use-before-define
  let direWolf = await DDBSummonsManager.getDDBCompendiumDocument({ pack: dddCompendium, name: "Dire Wolf" });
  let direWolfVersion = 2;

  if (!direWolf) {
    // eslint-disable-next-line no-use-before-define
    direWolf = await DDBSummonsManager.getSRDCompendiumDocument({ pack, name: "Dire Wolf" });
    direWolfVersion = 1;
  }
  if (direWolf) {
    foundry.utils.mergeObject(results, getHoundOfIllOmen(direWolf, direWolfVersion));
  }

  return results;
}

async function getArcaneEyes() {
  const results = {
    ArcaneEye: {
      name: "Arcane Eye",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Arcane Eye",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Arcane Eye",
        "prototypeToken.name": "Arcane Eye",
        "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/Marker_01_Regular_BlueYellow_400x400.webm",
        "img": "modules/ddb-importer/img/jb2a/Marker_01_Regular_BlueYellow_Thumb.webp",
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
        "effects": [
          (await ActiveEffect.implementation.fromStatusEffect("invisible")).toObject(),
        ],
      }),
    },
  };
  return results;
};

function getDancingLights(jb2aMod) {
  const dancingLightsBase = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), foundry.utils.deepClone(DANCING_LIGHTS_BASE));
  const results = {
    DancingLightsYellow: {
      name: "Dancing Lights (Yellow)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Yellow)",
        "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_200x200.webm",
        "prototypeToken.light": {
          "color": "#ffed7a",
          "alpha": 0.25,
        },
        "img": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_Thumb.webp",
      }),
    },
    DancingLightsGreen: {
      name: "Dancing Lights (Green)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Green)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Green_200x200.webm`,
        "prototypeToken.light": {
          "color": "#a7ff7a",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Green_Thumb.webp`,
      }),
    },
    DancingLightsBlueTeal: {
      name: "Dancing Lights (Blue Teal)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Blue Teal)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueTeal_200x200.webm`,
        "prototypeToken.light": {
          "color": "#80ffff",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueTeal_Thumb.webp`,
      }),
    },
    DancingLightsBlueYellow: {
      name: "Dancing Lights (Blue Yellow)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Blue Yellow)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueYellow_200x200.webm`,
        "prototypeToken.light": {
          "color": "#c1e6e6",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueYellow_Thumb.webp`,
      }),
    },
    DancingLightsPink: {
      name: "Dancing Lights (Pink)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Pink)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Pink_200x200.webm`,
        "prototypeToken.light": {
          "color": "#f080ff",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Pink_Thumb.webp`,
      }),
    },
    DancingLightsPurpleGreen: {
      name: "Dancing Lights (Purple Green)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Purple Green)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_PurpleGreen_200x200.webm`,
        "prototypeToken.light": {
          "color": "#a66bff",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_PurpleGreen_Thumb.webp`,
      }),
    },
    DancingLightsRed: {
      name: "Dancing Lights (Red)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Red)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Red_200x200.webm`,
        "prototypeToken.light": {
          "color": "#ff817a",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Red_Thumb.webp`,
      }),
    },
  };

  return results;
}

function getMageHands(jb2aMod) {
  return {
    MageHandRed: {
      name: "Mage Hand (Red)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Red)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_400x400.webm",
        "img": "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_Thumb.webp",
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandPurple: {
      name: "Mage Hand (Purple)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Purple)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandGreen: {
      name: "Mage Hand (Green)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Green)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandBlue: {
      name: "Mage Hand (Blue)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Blue)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandRock: {
      name: "Mage Hand (Rock)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      needsJB2APatreon: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Rock)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandRainbow: {
      name: "Mage Hand (Rainbow)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      needsJB2APatreon: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Rainbow)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
  };
}

function getBubblingCauldrons() {
  return {
    TashasBubblingCauldron: {
      name: "Tasha's Bubbling Cauldron",
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Tasha's Bubbling Cauldron",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Bubbling Cauldron",
        "prototypeToken": {
          name: "Bubbling Cauldron",
          width: 1,
          height: 1,
          texture: {
            src: "icons/skills/toxins/cauldron-pot-bubbles-green.webp",
            scaleX: 0.5,
            scaleY: 0.5,
          },
        },
        "prototypeToken.name": "Bubbling Cauldron",
        "system.traits.size": "sm",
        img: "icons/skills/toxins/cauldron-pot-bubbles-green.webp",
      }),
    },
  };
}

async function getSummonActors() {
  const jb2aMod = game.modules.get('jb2a_patreon')?.active
    ? "jb2a_patreon"
    : "JB2A_DnD5e";

  const arcaneEyes = await getArcaneEyes();
  const dancingLights = getDancingLights(jb2aMod);
  const mageHands = getMageHands(jb2aMod);
  const getBubblingCauldron = getBubblingCauldrons();

  const localActors = {
    ...arcaneEyes,
    ...dancingLights,
    ...mageHands,
    ...getBubblingCauldron,
  };

  const srdActors = await getSRDActors();
  return foundry.utils.mergeObject(srdActors, localActors);
}

const JB2A_LICENSE = `<p>The assets in this actor are kindly provided by JB2A and are licensed by <a href="https://creativecommons.org/licenses/by-nc-sa/4.0">Attribution-NonCommercial-ShareAlike 4.0 International</a>.</p>
<p>Check them out at <a href="https://jb2a.com">https://jb2a.com</a> they have a free and patreon supported Foundry module providing wonderful animations and assets for a variety of situations.</p>
<p>You can learn more about their Foundry modules <a href="https://jb2a.com/home/install-instructions/">here</a>.</p>`;


export default class DDBSummonsManager {

  constructor({ ddbData } = {}) {
    this.ddbData = ddbData;
    this.indexFilter = { fields: [
      "name",
      "flags.ddbimporter.compendiumId",
      "flags.ddbimporter.id",
      "flags.ddbimporter.summons",
    ] };
    this.itemHandler = null;
  }

  async generateDDBDataActors(ddbFeature) {
    if (!ddbFeature) return undefined;
    if (!this.ddbData) return undefined;
    if (ddbFeature.originalName === "Eldritch Cannon") {
      for (const size of ["Small", "Tiny"]) {
        const cannonBase = getEldritchCannonStub(size.toLowerCase());
        return cannonBase;
      }
    }
    // KNOWN_ISSUE_4_0 for say eldrich cannon
    return undefined;
  }

  async init() {
    this.compendiumFolders = new DDBCompendiumFolders("summons");
    await this.compendiumFolders.loadCompendium("summons");

    this.itemHandler = new DDBItemImporter("summons", [], {
      indexFilter: this.indexFilter,
      matchFlags: ["is2014", "is2024"],
    });
    await this.itemHandler.init();
  }

  async addToCompendium(companion) {
    const results = [];
    if (!game.user.isGM) return results;
    const compendiumCompanion = foundry.utils.deepClone(companion);
    delete compendiumCompanion.folder;
    const folderName = this.compendiumFolders.getSummonFolderName(compendiumCompanion);
    const folder = await this.compendiumFolders.createSummonsFolder(folderName.name);
    compendiumCompanion.folder = folder._id;
    const npc = await addNPC(compendiumCompanion, "summons");
    results.push(npc);
    return results;
  }

  static async getSRDCompendiumDocument({ pack = null, id = null, name = null }) {
    const compendium = pack ?? game.packs.get("dnd5e.monsters");
    if (!compendium) return undefined;
    if (!id) id = DDBSummonsManager.MONSTER_MAP[name];
    if (!id) return undefined;
    const doc = await compendium.getDocument(id);
    return doc;
  }

  static async getDDBCompendiumDocument({ pack = null, id = null, name = null, srdFallback = false }) {
    const compendium = pack ?? CompendiumHelper.getCompendiumType("monster", false);
    if (!compendium) return undefined;
    await compendium.getIndex();
    if (id) {
      const doc = await compendium.getDocument(id);
      if (doc) return doc;
    }
    if (name) {
      const indexMatch = compendium.index.find((a) => a.name === name);
      if (indexMatch) {
        const doc = await fromUuid(indexMatch.uuid);
        return doc;
      }
    }
    if (srdFallback) {
      return DDBSummonsManager.getSRDCompendiumDocument({ pack, id, name });
    }
    return undefined;

  }

  static MONSTER_MAP = {
    "Arcane Hand": "iHj5Tkm6HRgXuaWP",
    "Arcane Sword": "Tac7eq0AXJco0nml",
    "Dire Wolf": "EYiQZ3rFL25fEJY5",
  };

  static get2024ArcaneHands = get2024ArcaneHands;

  static async addGeneratedSummons(generatedSummonedActors) {
    if (!game.user.isGM) return;
    const manager = new DDBSummonsManager();
    await manager.init();

    for (const [key, value] of Object.entries(generatedSummonedActors)) {
      // check for JB2A modules
      if (value.needsJB2A
        && !game.modules.get('jb2a_patreon')?.active
        && !game.modules.get('JB2A_DnD5e')?.active
      ) continue;
      if (value.needsJB2APatreon && !game.modules.get('jb2a_patreon')?.active) continue;
      const existingSummons = manager.itemHandler.compendium.index.find((i) =>
        i.flags?.ddbimporter?.summons?.summonsKey === key,
      );

      if (existingSummons && existingSummons.flags.ddbimporter.summons.version >= value.version) continue;

      // set summons data
      const companion = foundry.utils.deepClone(value.data);
      foundry.utils.setProperty(companion, "flags.ddbimporter.summons", {
        summonsKey: key,
        version: value.version,
        folder: value.folderName,
      });
      companion._id = utils.namedIDStub(value.name, { prefix: "ddbSum" });

      if (value.isJB2A) {
        foundry.utils.setProperty(companion, "system.details.biography", {
          value: JB2A_LICENSE,
          public: JB2A_LICENSE,
        });
      }

      logger.debug(`Creating ${key}`, companion);

      await manager.addToCompendium(companion);
    }
  }

  static async generateFixedSummons() {
    if (!game.user.isGM) return;
    logger.debug("Generating Fixed summons");

    const generatedSummonedActors = await getSummonActors();
    await DDBSummonsManager.addGeneratedSummons(generatedSummonedActors);
  }

  static DEFAULT_SUMMON = {
    match: {
      proficiency: false,
      attacks: false,
      saves: false,
    },
    bonuses: {
      ac: "",
      hp: "",
      attackDamage: "",
      saveDamage: "",
      healing: "",
    },
    profiles: [],
    creatureSizes: [],
    creatureTypes: [],
    summon: {
      prompt: true,
      mode: "",
    },
  };

  addProfilesToActivity(activity, summonsKeys = [], data = {}) {

    const summonActors = this.itemHandler.compendium.index.filter((i) =>
      summonsKeys.includes(i.flags?.ddbimporter?.summons?.summonsKey),
    );
    const profiles = summonActors
      .map((actor) => {
        return {
          _id: actor._id,
          name: actor.name,
          uuid: actor.uuid,
          count: 1,
        };
      });

    const baseData = foundry.utils.mergeObject(
      foundry.utils.deepClone(DDBSummonsManager.DEFAULT_SUMMON), data);

    baseData.profiles = profiles;
    activity = foundry.utils.mergeObject(activity, baseData);

  }


}
