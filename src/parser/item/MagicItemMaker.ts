// import { DICTIONARY } from "../../config/_module";
// import { logger } from "../../lib/_module";
// import DDBItem from "./DDBItem";

// Provides some helper functions for Magic Items modules

interface IMagicItemSpell {
  id: string;
  name: string;
  img: string;
  pack: string;
  baseLevel: number;
  level: number;
  consumption: number;
  upcast: number;
  upcastCost: number;
  limitedUse: IDDBSpellLimitedUse | undefined;
}

export default class MagicItemMaker {

  static MAGICITEMS = {
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

  static checkDestroy(description: string) {
    const destroy = /expend the .* last charge/i;
    if (description.search(destroy) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  static checkD20Destroy(description: string) {
    const destroy = /roll a d20.*destroyed/i;
    if (description.search(destroy) !== -1) {
      return MagicItemMaker.MAGICITEMS.DestroyCheck1D20;
    } else {
      return MagicItemMaker.MAGICITEMS.DestroyCheckAlways;
    }
  }

  static buildMagicItemSpell(chargeType: string, itemSpell: I5eSpellItem): IMagicItemSpell {
    let consumption = chargeType == MagicItemMaker.MAGICITEMS.CHARGE_TYPE_PER_SPELL
      ? 1
      : itemSpell.system.level;
    let castLevel = itemSpell.system.level;
    let upcast = itemSpell.system.level;
    const limitedUse: IDDBSpellLimitedUse | undefined = foundry.utils.getProperty(itemSpell, "flags.ddbimporter.dndbeyond.spellLimitedUse") as IDDBSpellLimitedUse | undefined;

    // Do we have charge use data on spell?
    if (limitedUse) {
      if (
        chargeType == MagicItemMaker.MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM
        && !!limitedUse.minNumberConsumed
        && itemSpell.system.level !== 0
      ) {
        consumption = limitedUse.minNumberConsumed;
        if (limitedUse.maxNumberConsumed) {
          upcast = itemSpell.system.level - limitedUse.minNumberConsumed + limitedUse.maxNumberConsumed;
        }
      }

      const castAtLevel = itemSpell.flags.ddbimporter?.dndbeyond?.castAtLevel;
      if (castAtLevel) {
        castLevel = castAtLevel;
      }
    }
    const spellName: string = itemSpell.flags.ddbimporter?.originalName ?? itemSpell.name;

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
      limitedUse,
    };
  }
}

