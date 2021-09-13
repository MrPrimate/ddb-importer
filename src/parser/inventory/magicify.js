//
// Attempts to parse information from ddb about items to build a magicitems
// compatible set of metadata.
//
// https://gitlab.com/riccisi/foundryvtt-magic-items/
//
// Wand of Entangle Target example
//
// flags": {
// "magicitems": {
//       "enabled": true,
//       "charges": "7",
//       "chargeType": "c1",
//       "destroy": true,
//       "destroyCheck": "d1",
//       "rechargeable": true,
//       "recharge": "1d6+1",
//       "rechargeType": "t2",
//       "rechargeUnit": "r2",
//       "spells": {
//           "0": {
//               "id": "af8QUpphSZMoi2yb",
//               "name": "Entangle",
//               "pack": "world.spellsdndbeyond",
//               "img": "iconizer/Spell_Nature_StrangleVines.png",
//               "baseLevel": "1",
//               "level": "1",
//               "consumption": "1",
//               "upcast": "1",
//               "upcastCost": "1"
//           }
//       }
// "feats": {},
// "tables": {},
// "equipped": true,
// "attuned": true,
// "destroyFlavorText": "reaches 0 charges: it crumbles into ashes and is destroyed.",
// "sorting": "l"

// }
//
//
//
import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

const MAGICITEMS = {};
MAGICITEMS.DAILY = "r1";
MAGICITEMS.SHORT_REST = "r4";
MAGICITEMS.LONG_REST = "r5";
MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM = "c1";
MAGICITEMS.CHARGE_TYPE_PER_SPELL = "c2";
MAGICITEMS.NUMERIC_RECHARGE = "t1";
MAGICITEMS.FORMULA_RECHARGE = "t2";
MAGICITEMS.DestroyCheckAlways = "d1";
MAGICITEMS.DestroyCheck1D20 = "d2";

function getRechargeFormula(description, maxCharges) {
  if (description === "") {
    return maxCharges;
  }

  let chargeMatchFormula = /regains (\dd\d* \+ \d) expended charges/i;
  let chargeMatchFixed = /regains (\d*) /i;
  let chargeMatchLastDitch = /(\dd\d* \+ \d)/i;
  let chargeNextDawn = /can't be used this way again until the next/i;

  let matchFormula = chargeMatchFormula.exec(description);
  let matchFixed = chargeMatchFixed.exec(description);
  let matchLastDitch = chargeMatchLastDitch.exec(description);

  let match = maxCharges;
  if (matchFormula && matchFormula[1]) {
    match = matchFormula[1];
  } else if (matchFixed && matchFixed[1]) {
    match = matchFixed[1];
  } else if (matchLastDitch && matchLastDitch[1]) {
    match = matchLastDitch[1];
  } else if (description.search(chargeNextDawn) !== -1) {
    match = maxCharges;
  }

  return match;
}

function getPerSpell(useDescription, itemDescription) {
  if (useDescription === "") {
    // some times 1 use per day items, like circlet of blasting have nothing in
    // the limited use description, fall back to this
    let limitedUse = /can't be used this way again until the next/i;
    if (itemDescription.search(limitedUse) !== -1) {
      return 1;
    }
    return false;
  }

  let perSpell = /each ([A-z]*|\n*) per/i;
  let match = perSpell.exec(useDescription);
  if (match) {
    match = DICTIONARY.magicitems.nums.find((num) => num.id == match[1]).value;
  } else {
    match = false;
  }
  return match;
}

function checkDestroy(description) {
  let destroy = /expend the .* last charge/i;
  if (description.search(destroy) !== -1) {
    return true;
  } else {
    return false;
  }
}

function checkD20Destroy(description) {
  let destroy = /roll a d20.*destroyed/i;
  if (description.search(destroy) !== -1) {
    return MAGICITEMS.DestroyCheck1D20;
  } else {
    return MAGICITEMS.DestroyCheckAlways;
  }
}

// returns the default magicitem flags
function buildMagicItemSpell(chargeType, itemSpell) {
  let consumption = chargeType == MAGICITEMS.CHARGE_TYPE_PER_SPELL ? 1 : itemSpell.data.level;
  let castLevel = itemSpell.data.level;
  let upcast = itemSpell.data.level;

  // Do we have charge use data on spell?
  if (itemSpell.flags.ddbimporter.dndbeyond.spellLimitedUse) {
    const limitedUse = itemSpell.flags.ddbimporter.dndbeyond.spellLimitedUse;

    if (
      chargeType == MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM &&
      !!limitedUse.minNumberConsumed &&
      itemSpell.data.level !== 0
    ) {
      consumption = limitedUse.minNumberConsumed;
      if (limitedUse.maxNumberConsumed) {
        upcast = itemSpell.data.level - limitedUse.minNumberConsumed + limitedUse.maxNumberConsumed;
      }
    }

    if (itemSpell.flags.ddbimporter.dndbeyond.castAtLevel) {
      castLevel = itemSpell.flags.ddbimporter.dndbeyond.castAtLevel;
    }
  }

  return {
    id: "",
    name: itemSpell.name,
    img: "",
    pack: "",
    baseLevel: itemSpell.data.level,
    level: castLevel,
    consumption: consumption,
    upcast: upcast,
    upcastCost: 1,
  };
}

function getItemSpells(itemId, chargeType, itemSpells) {
  let spells = {};

  for (let spellIndex = 0, i = 0; i < itemSpells.length; i++) {
    if (itemSpells[i].flags.ddbimporter.dndbeyond.lookupId === itemId) {
      spells[spellIndex] = buildMagicItemSpell(chargeType, itemSpells[i]);
      spellIndex++;
    }
  }

  return spells;
}

function createDefaultItem() {
  return {
    enabled: true,
    charges: 0,
    chargeType: MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM, // c1 charge whole item, c2 charge per spells
    rechargeable: false,
    recharge: 0, // recharge amount/formula
    rechargeType: MAGICITEMS.FORMULA_RECHARGE, // t1 fixed amount, t2 formula
    rechargeUnit: "", // r1 daily, r2 dawn, r3 sunset, r4vshort rest, r5 long rest
    destroy: false, // destroy on depleted?
    destroyCheck: MAGICITEMS.DestroyCheckAlways, // d1 always, 1d20
    spells: {},
    feats: {},
    tables: {},
    equipped: true,
    attuned: false,
    destroyFlavorText: (utils.isModuleInstalledAndActive("magicitems"))
      ? game.i18n.localize("MAGICITEMS.MagicItemDestroy")
      : "reaches 0 charges: it crumbles into ashes and is destroyed.",
    sorting: "l"
  };
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function getResetType(description) {
  let resetType = null;

  const chargeMatchFormula = /expended charges (?:\w) at (\w)/i;
  const usedAgainFormula = /(?:until|when) you (?:take|finish) a (short|long|short or long) rest/i;
  const chargeNextDawnFormula = /can't be used this way again until the next (dawn|dusk)/i;

  const chargeMatch = chargeMatchFormula.exec(description);
  const untilMatch = usedAgainFormula.exec(description);
  const dawnMatch = chargeNextDawnFormula.exec(description);

  if (chargeMatch && chargeMatch[1]) {
    resetType = capitalize(`${chargeMatch[1]}Rest`);
  } else if (untilMatch && untilMatch[1]) {
    switch (untilMatch[1]) {
      case "short or long":
        resetType = "ShortRest";
        break;
      default:
        resetType = capitalize(`${untilMatch[1]}Rest`);
    }
  } else if (dawnMatch && dawnMatch[1]) {
    resetType = capitalize(`${dawnMatch[1]}Rest`);
  }

  return resetType;
}

export function parseMagicItem(data, itemSpells, characterItem = true) {
  // this builds metadata for the magicitems module to use
  // https://gitlab.com/riccisi/foundryvtt-magic-items/

  if (data.definition.magic) {
    // default magicitem data
    let magicItem = createDefaultItem();
    magicItem.equipped = data.definition.canEquip;

    if (!characterItem) {
      const maxUses = "has (\\d*) charges";
      const maxUsesMatches = maxUses.exec(data.definition.description);
      const limitedUse = {
        maxUses: (maxUsesMatches && maxUsesMatches[1]) ? maxUsesMatches[1] : null,
        numberUsed: 0,
        resetType: getResetType(data.definition.description),
        resetTypeDescription: data.definition.description,
      };

      if (limitedUse.maxUses || limitedUse.resetType) data.limitedUse = limitedUse;
    }

    if (data.limitedUse) {
      // if the item is x per spell
      let perSpell = getPerSpell(data.limitedUse.resetTypeDescription, data.definition.description);
      if (perSpell) {
        magicItem.charges = perSpell;
        magicItem.recharge = perSpell;
        magicItem.rechargeUnit = MAGICITEMS.DAILY;
        magicItem.rechargeable = true;
        magicItem.rechargeType = MAGICITEMS.NUMERIC_RECHARGE;
        magicItem.chargeType = MAGICITEMS.CHARGE_TYPE_PER_SPELL;
      } else {
        magicItem.charges = data.limitedUse.maxUses;
        magicItem.recharge = getRechargeFormula(data.limitedUse.resetTypeDescription, magicItem.charges);

        if (data.limitedUse.resetType) {
          magicItem.rechargeUnit = DICTIONARY.magicitems.rechargeUnits.find(
            (reset) => reset.id == data.limitedUse.resetType
          ).value;
        }
        magicItem.rechargeable = true;
      }

      magicItem.destroy = checkDestroy(data.limitedUse.resetTypeDescription);
      magicItem.destroyCheck = checkD20Destroy(data.limitedUse.resetTypeDescription);
    }

    magicItem.spells = getItemSpells(data.definition.id, magicItem.chargeType, itemSpells);

    return magicItem;
  } else {
    return {
      enabled: false,
    };
  }
}

