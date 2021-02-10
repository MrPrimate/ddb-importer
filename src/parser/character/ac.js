import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import utils from "../../utils.js";

/**
 * This excludes shields
 * @param {} data
 */
export function isArmored(data) {
  return (
    data.character.inventory.filter(
      (item) => item.equipped && item.definition.armorClass && item.definition.armorTypeId !== 4
    ).length >= 1
  );
}

let getMinimumBaseAC = (modifiers) => {
  let hasBaseArmor = modifiers.filter(
    (modifier) => modifier.type === "set" && modifier.subType === "minimum-base-armor" && modifier.isGranted
  );
  let baseAC = [];
  hasBaseArmor.forEach((base) => {
    baseAC.push(base.value);
  });
  return baseAC;
};

let getBaseArmor = (ac, armorType, name = "Racial") => {
  return {
    definition: {
      name: `"Base Armor - ${name}`,
      type: armorType,
      armorClass: ac,
      armorTypeId: DICTIONARY.equipment.armorType.find((id) => id.name === armorType).id,
      grantedModifiers: [],
      canAttune: false,
      filterType: "Armor",
    },
    isAttuned: false,
  };
};

let getEquippedAC = (equippedGear) => {
  return equippedGear.reduce((prev, item) => {
    let ac = 0;
    // regular armor
    if (item.definition.armorClass) {
      ac += item.definition.armorClass;
    }

    // magical armor
    if (item.definition.grantedModifiers) {
      let isAvailable = false;
      // does an item need attuning
      if (item.definition.canAttune === true) {
        if (item.isAttuned === true) {
          isAvailable = true;
        }
      } else {
        isAvailable = true;
      }

      if (isAvailable) {
        item.definition.grantedModifiers.forEach((modifier) => {
          if (modifier.type === "bonus" && modifier.subType === "armor-class") {
            // add this to armor AC
            ac += modifier.value;
          }
        });
      }
    }
    return prev + ac;
  }, 0);
};

// returns an array of ac values from provided array of modifiers
let getUnarmoredAC = (modifiers, character) => {
  let unarmoredACValues = [];
  const isUnarmored = modifiers.filter(
    (modifier) => modifier.type === "set" && modifier.subType === "unarmored-armor-class" && modifier.isGranted
  );

  const maxUnamoredDexMods = modifiers.filter(
    (modifier) => modifier.type === "set" && modifier.subType === "ac-max-dex-modifier" && modifier.isGranted
  ).map((mods) => mods.value);
  const maxUnamoredDexMod = Math.min(...maxUnamoredDexMods, 20);

  // console.log(`Max Dex: ${maxUnamoredDexMod}`);

  isUnarmored.forEach((unarmored) => {
    let unarmoredACValue = 10;
    // +DEX
    // for a case of setting unarmoured ac, the dex won't detract
    unarmoredACValue += Math.max(0, Math.min(character.data.abilities.dex.mod, maxUnamoredDexMod));
    // +WIS or +CON, if monk or barbarian, draconic resilience === null

    // console.log(`Unarmoured AC Value: ${unarmoredACValue}`);
    // console.log(unarmored);

    if (unarmored.statId !== null) {
      let ability = DICTIONARY.character.abilities.find((ability) => ability.id === unarmored.statId);
      unarmoredACValue += character.data.abilities[ability.value].mod;
    } else {
      // others are picked up here e.g. Draconic Resilience
      unarmoredACValue += unarmored.value;
    }
    unarmoredACValues.push(unarmoredACValue);
  });
  // console.warn(unarmoredACValues);
  return unarmoredACValues;
};

// returns an array of ac values from provided array of modifiers
let getArmoredACBonuses = (modifiers, character) => {
  let armoredACBonuses = [];
  const armoredBonuses = modifiers.filter(
    (modifier) => modifier.subType === "armored-armor-class" && modifier.isGranted
  );

  armoredBonuses.forEach((armoredBonus) => {
    let armoredACBonus = 0;
    if (armoredBonus.statId !== null) {
      let ability = DICTIONARY.character.abilities.find((ability) => ability.id === armoredBonus.statId);
      armoredACBonus += character.data.abilities[ability.value].mod;
    } else {
      armoredACBonus += armoredBonus.value;
    }
    armoredACBonuses.push(armoredACBonus);
  });
  return armoredACBonuses;
};

function getDualWieldAC(data, modifiers) {
  const dualWielding = data.character.characterValues.some((cv) => {
    const equipped = data.character.inventory.some((item) => item.equipped && item.id == cv.valueId);
    const dualWielding = cv.typeId === 18;
    return equipped && dualWielding;
  });
  let dualWieldBonus = 0;

  if (dualWielding) {
    utils.filterModifiers(modifiers, "bonus", "dual-wield-armor-class").forEach((bonus) => {
      dualWieldBonus += bonus.value;
    });
  }

  return dualWieldBonus;
}

export function getArmorClass(data, character) {
  const overRideAC = data.character.characterValues.find((val) => val.typeId === 1);

  if (overRideAC) {
    return {
      type: "Number",
      label: "Armor Class",
      value: overRideAC.value,
    };
  }

  // array to assemble possible AC values
  let armorClassValues = [];
  // get a list of equipped armor
  // we make a distinction so we can loop over armor
  let equippedArmor = data.character.inventory.filter(
    (item) => item.equipped && item.definition.filterType === "Armor"
  );
  let baseAC = 10;
  // for things like fighters fighting style
  let miscACBonus = 0;
  // lets get equipped gear
  const equippedGear = data.character.inventory.filter(
    (item) => item.equipped && item.definition.filterType !== "Armor"
  );
  const unarmoredACBonus = utils
    .filterBaseModifiers(data, "bonus", "unarmored-armor-class")
    .reduce((prev, cur) => prev + cur.value, 0);

  // lets get the AC for all our non-armored gear, we'll add this later
  const gearAC = getEquippedAC(equippedGear);

  // While not wearing armor, lets see if we have special abilities
  if (!isArmored(data)) {
    // unarmored abilities from Class/Race?
    const unarmoredSources = [utils.getChosenClassModifiers(data), data.character.modifiers.race, data.character.modifiers.feat];
    unarmoredSources.forEach((modifiers) => {
      const unarmoredAC = Math.max(getUnarmoredAC(modifiers, character));
      if (unarmoredAC) {
        // we add this as an armored type so we can get magical item bonuses
        // e.g. ring of protection
        equippedArmor.push(getBaseArmor(unarmoredAC, "Unarmored Defense", "Unarmored defense"));
      }
    });
  } else {
    // check for things like fighters fighting style defense
    const armorBonusSources = [utils.getChosenClassModifiers(data), data.character.modifiers.race];
    armorBonusSources.forEach((modifiers) => {
      const armoredACBonuses = getArmoredACBonuses(modifiers, character);
      miscACBonus += armoredACBonuses.reduce((a, b) => a + b, 0);
    });
  }

  // Generic AC bonuses like Warforfed Integrated Protection
  // item modifiers are loaded by ac calcs
  const miscModifiers = [
    utils.getChosenClassModifiers(data),
    data.character.modifiers.race,
    data.character.modifiers.background,
    data.character.modifiers.feat,
  ];

  utils.filterModifiers(miscModifiers, "bonus", "armor-class").forEach((bonus) => {
    miscACBonus += bonus.value;
  });

  miscACBonus += data.character.characterValues.filter((value) =>
    value.typeId === 3 || value.typeId === 2
  ).map((val) => val.value).reduce((a, b) => a + b, 0);

  miscACBonus += getDualWieldAC(data, miscModifiers);

  // Each racial armor appears to be slightly different!
  // We care about Tortles and Lizardfolk here as they can use shields, but their
  // modifier is set differently
  switch (data.character.race.fullName) {
    case "Lizardfolk":
      baseAC = Math.max(getUnarmoredAC(data.character.modifiers.race, character));
      equippedArmor.push(getBaseArmor(baseAC, "Natural Armor", "Lizardfolk"));
      break;
    case "Tortle":
      baseAC = Math.max(getMinimumBaseAC(data.character.modifiers.race, character));
      equippedArmor.push(getBaseArmor(baseAC, "Natural Armor", "Tortle"));
      break;
    default:
      equippedArmor.push(getBaseArmor(baseAC, "Unarmored"));
  }

  const shields = equippedArmor.filter((shield) => shield.definition.armorTypeId === 4);
  const armors = equippedArmor.filter((armour) => armour.definition.armorTypeId !== 4);

  logger.debug("Calculated GearAC: " + gearAC);
  logger.debug("Unarmoured AC Bonus:" + unarmoredACBonus);
  logger.debug("Calculated MiscACBonus: " + miscACBonus);
  logger.debug("Equipped AC Options: ", equippedArmor);
  logger.debug("Armors: ", armors);
  logger.debug("Shields: ", shields);

  // the presumption here is that you can only wear a shield and a single
  // additional 'armor' piece. in DDB it's possible to equip multiple armor
  // types and it works out the best AC for you
  // we also want to handle unarmored for monks etc.
  // we might have multiple shields "equipped" by accident, so work out
  // the best one
  for (var armor = 0; armor < armors.length; armor++) {
    let armorAC = 0;
    if (shields.length === 0) {
      // getEquippedAC fetches any magical AC boost on the items passed
      armorAC = getEquippedAC([armors[armor]]);
    } else {
      for (var shield = 0; shield < shields.length; shield++) {
        const combinedAC = getEquippedAC([armors[armor], shields[shield]]);
        if (combinedAC > armorAC) armorAC = combinedAC;
      }
    }

    // Determine final AC values based on AC Type
    // Light Armor: AC + DEX
    // Medium Armor: AC + DEX (max 2)
    // Heavy Armor: AC only
    // Unarmored Defense: Dex mod already included in calculation

    // sometimes the type field can be blank in DDB
    if (!armors[armor].definition.type || armors[armor].definition.type === "") {
      const armourTypeId = armors[armor].definition.armorTypeId;
      const acType = DICTIONARY.equipment.armorType.find((a) => a.id === armourTypeId);
      if (acType) armors[armor].definition.type = acType.name;
    }

    switch (armors[armor].definition.type) {
      case "Natural Armor": {
        let acCalc = 0;
        // Tortles don't get to add an unarmored ac bonus for their shell
        const ignoreUnarmouredACBonus = utils.filterBaseModifiers(data, "ignore", "unarmored-dex-ac-bonus");
        if (ignoreUnarmouredACBonus) {
          acCalc = armorAC + gearAC + miscACBonus;
          // console.log(armorAC);
          // console.log(gearAC);
          // console.log(miscACBonus);
        } else {
          acCalc = armorAC + gearAC + miscACBonus + unarmoredACBonus;
        }
        armorClassValues.push({
          name: armors[armor].definition.name,
          value: acCalc,
        });
        break;
      }
      case "Unarmored Defense":
        armorClassValues.push({
          name: armors[armor].definition.name,
          value: armorAC + gearAC + miscACBonus + unarmoredACBonus,
        });
        break;
      case "Heavy Armor":
        armorClassValues.push({
          name: armors[armor].definition.name,
          value: armorAC + gearAC + miscACBonus,
        });
        break;
      case "Medium Armor": {
          const maxDexMedium = Math.max(...utils.filterBaseModifiers(data, "set", "ac-max-dex-armored-modifier")
            .map((mod) => mod.value), 2);
          armorClassValues.push({
            name: armors[armor].definition.name,
            value: armorAC + Math.min(maxDexMedium, character.data.abilities.dex.mod) + gearAC + miscACBonus,
          });
          break;
        }
      case "Light Armor":
        armorClassValues.push({
          name: armors[armor].definition.name,
          value: armorAC + character.data.abilities.dex.mod + gearAC + miscACBonus,
        });
        break;
      default:
        armorClassValues.push({
          name: armors[armor].definition.name,
          value: armorAC + character.data.abilities.dex.mod + gearAC + miscACBonus,
        });
        break;
    }
  }

  logger.debug("Final AC Choices:", armorClassValues);
  // get the max AC we can use from our various computed values
  const max = Math.max(...armorClassValues.map((type) => type.value));

  return {
    type: "Number",
    label: "Armor Class",
    value: max,
  };
}
