import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import { getUses, getRechargeFormula } from "./common.js";

const MAGICITEMS = {
  DAILY: "r1",
  SHORT_REST: "r4",
  LONG_REST: "r5",
  CHARGE_TYPE_WHOLE_ITEM: "c1",
  CHARGE_TYPE_PER_SPELL: "c2",
  NUMERIC_RECHARGE: "t1",
  FORMULA_RECHARGE: "t2",
  DestroyCheckAlways: "d1",
  DestroyCheck1D20: "d2",
};

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
  let consumption = chargeType == MAGICITEMS.CHARGE_TYPE_PER_SPELL ? 1 : itemSpell.system.level;
  let castLevel = itemSpell.system.level;
  let upcast = itemSpell.system.level;

  // Do we have charge use data on spell?
  if (itemSpell.flags.ddbimporter.dndbeyond.spellLimitedUse) {
    const limitedUse = itemSpell.flags.ddbimporter.dndbeyond.spellLimitedUse;

    if (
      chargeType == MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM
      && !!limitedUse.minNumberConsumed
      && itemSpell.system.level !== 0
    ) {
      consumption = limitedUse.minNumberConsumed;
      if (limitedUse.maxNumberConsumed) {
        upcast = itemSpell.system.level - limitedUse.minNumberConsumed + limitedUse.maxNumberConsumed;
      }
    }

    if (itemSpell.flags.ddbimporter.dndbeyond.castAtLevel) {
      castLevel = itemSpell.flags.ddbimporter.dndbeyond.castAtLevel;
    }
  }
  const spellName = foundry.utils.hasProperty(itemSpell, "flags.ddbimporter.originalName")
    ? itemSpell.flags.ddbimporter.originalName
    : itemSpell.name;

  return {
    id: "",
    name: spellName,
    img: "",
    pack: "",
    baseLevel: itemSpell.system.level,
    level: castLevel,
    consumption,
    upcast,
    upcastCost: 1,
  };
}

function getMagicItemSpells(itemId, chargeType, itemSpells) {
  let spells = {};

  for (let spellIndex = 0, i = 0; i < itemSpells.length; i++) {
    if (itemSpells[i].flags.ddbimporter.dndbeyond.lookupId === itemId) {
      spells[spellIndex] = buildMagicItemSpell(chargeType, itemSpells[i]);
      spellIndex++;
    }
  }

  return spells;
}

function createDefaultMagicItemFlags() {
  return {
    enabled: true,
    charges: 0,
    chargeType: MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM, // c1 charge whole item, c2 charge per spells
    rechargeable: false,
    recharge: "0", // recharge amount/formula
    rechargeType: MAGICITEMS.FORMULA_RECHARGE, // t1 fixed amount, t2 formula
    rechargeUnit: "", // r1 daily, r2 dawn, r3 sunset, r4vshort rest, r5 long rest
    destroy: false, // destroy on depleted?
    destroyCheck: MAGICITEMS.DestroyCheckAlways, // d1 always, 1d20
    spells: {},
    feats: {},
    tables: {},
    equipped: true,
    attuned: false,
    destroyFlavorText: game.modules.get("magicitems")?.active
      ? game.i18n.localize("MAGICITEMS.MagicItemDestroy")
      : "reaches 0 charges: it crumbles into ashes and is destroyed.",
    sorting: "l"
  };
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function getMagicItemResetType(description) {
  let resetType = null;

  const chargeMatchFormula = /expended charges (?:\w+|each day) at (\w+)/i;
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
function parseMagicItemsModule(data, itemSpells, isCompendiumItem) {
  // this builds metadata for the magicitems module to use
  // https://gitlab.com/riccisi/foundryvtt-magic-items/

  if (data.definition.magic) {
    // default magicitem data
    let magicItem = createDefaultMagicItemFlags();
    magicItem.equipped = data.definition.canEquip;

    if (isCompendiumItem) {
      const maxUses = /has (\d*) charges/i;
      const maxUsesMatches = maxUses.exec(data.definition.description);
      const limitedUse = {
        maxUses: (maxUsesMatches && maxUsesMatches[1]) ? maxUsesMatches[1] : null,
        numberUsed: 0,
        resetType: getMagicItemResetType(data.definition.description),
        resetTypeDescription: data.definition.description,
      };

      if (limitedUse.maxUses || limitedUse.resetType) data.limitedUse = limitedUse;
    }

    if (data.limitedUse) {
      // if the item is x per spell
      const perSpell = getPerSpell(data.limitedUse.resetTypeDescription, data.definition.description);
      if (perSpell) {
        magicItem.charges = perSpell;
        magicItem.recharge = `${perSpell}`;
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
          )?.value ?? "";
        } else {
          const textType = getMagicItemResetType(data.definition.description);
          magicItem.rechargeUnit = DICTIONARY.magicitems.rechargeUnits.find(
            (reset) => reset.id == textType
          )?.value ?? "";
        }
        magicItem.rechargeable = true;
      }

      magicItem.destroy = checkDestroy(data.limitedUse.resetTypeDescription);
      magicItem.destroyCheck = checkD20Destroy(data.limitedUse.resetTypeDescription);
    }

    magicItem.spells = getMagicItemSpells(data.definition.id, magicItem.chargeType, itemSpells);

    return magicItem;
  } else {
    return {
      enabled: false,
    };
  }
}

function parseItemsWithSpellsModule(item, data, itemSpells, isCompendiumItem) {

  if (isCompendiumItem) {
    logger.debug("Non character item magic item additions are not supported");
  }

  const thisItemSpells = itemSpells.filter((spell) =>
    spell.flags.ddbimporter.dndbeyond.lookup === "item"
    && spell.flags.ddbimporter.dndbeyond.lookupId === item.flags.ddbimporter.definitionId
  );

  if (thisItemSpells.length === 0) return item;

  const perSpell = getPerSpell(data.limitedUse?.resetTypeDescription ?? "", data.definition.description);

  if (!perSpell && foundry.utils.getProperty(item, "system.uses.value") === null) {
    item.system.uses = getUses(data);
  }

  const iSpells = thisItemSpells.map((itemSpell) => {
    const isPerSpell = Number.isInteger(perSpell);
    const chargeType = isPerSpell
      ? MAGICITEMS.CHARGE_TYPE_PER_SPELL
      : MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM;

    // c1 charge whole item, c2 charge per spells
    const spellData = buildMagicItemSpell(chargeType, itemSpell);

    const resetType = data.limitedUse?.resetType
      ? DICTIONARY.resets.find((reset) =>
        reset.id == data.limitedUse.resetType
      )?.value ?? undefined
      : undefined;

    const uses = isPerSpell
      ? { max: spellData.charges, per: resetType ?? "" }
      : { max: "", per: "" };
    const consume = isPerSpell
      ? { amount: null }
      : { amount: spellData.consumption };

    const save = foundry.utils.getProperty(itemSpell, "flags.ddbimporter.dndbeyond.overrideDC")
      ? { scaling: "flat", dc: itemSpell.flags.ddbimporter.dndbeyond?.dc }
      : { scaling: "spell" };
    const preparation = isPerSpell
      ? { mode: "atwill" }
      : undefined;

    return {
      uuid: "",
      changes: {
        system: {
          level: Number.parseInt(spellData.level),
          uses,
          consume,
          save,
          preparation,
        },
      },
      flags: {
        ddbimporter: {
          spellName: spellData.name,
        },
        // "items-with-spells-5e": {
        //   "parent-item": "",
        // },
      },
    };
  });

  item.flags["items-with-spells-5e"] = {
    "item-spells": iSpells,
  };
  return item;
}

function basicMagicItem(item, data, itemSpells, isCompendiumItem) {
  if (data.definition.magic) {
    if (isCompendiumItem) {
      const maxUses = /has (\d*) charges/i;
      const maxUsesMatches = maxUses.exec(data.definition.description);
      const limitedUse = {
        maxUses: (maxUsesMatches && maxUsesMatches[1]) ? maxUsesMatches[1] : null,
        numberUsed: 0,
        resetType: getMagicItemResetType(data.definition.description),
        resetTypeDescription: data.definition.description,
      };

      if (limitedUse.maxUses) {
        foundry.utils.setProperty(item, "system.uses.value", parseInt(limitedUse.maxUses));
        foundry.utils.setProperty(item, "system.uses.max", `${limitedUse.maxUses}`);
        foundry.utils.setProperty(item, "system.uses.per", "charges");

        const recharge = getRechargeFormula(data.definition.description, limitedUse.maxUses);
        foundry.utils.setProperty(item, "system.uses.recovery", recharge);
      }
    }
  }
  return item;
}

export function parseMagicItem(item, data, itemSpells, isCompendiumItem = false) {
  if (game.modules.get("magicitems")?.active || game.modules.get("magic-items-2")?.active) {
    item.flags.magicitems = parseMagicItemsModule(data, itemSpells, !isCompendiumItem, true);
  } else if (game.modules.get("items-with-spells-5e")?.active) {
    item = parseItemsWithSpellsModule(item, data, itemSpells, !isCompendiumItem);
  } else {
    item = basicMagicItem(item, data, itemSpells, isCompendiumItem);
  }

  return item;
}
