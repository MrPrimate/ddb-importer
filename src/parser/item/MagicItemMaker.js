import { DICTIONARY } from "../../config/_module.mjs";
import { logger } from "../../lib/_module.mjs";
import DDBItem from "./DDBItem.js";

// Provides some helper functions for Magic Items modules

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

  static createDefaultMagicItemFlags() {
    return {
      enabled: true,
      charges: 0,
      chargeType: MagicItemMaker.MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM, // c1 charge whole item, c2 charge per spells
      rechargeable: false,
      recharge: "0", // recharge amount/formula
      rechargeType: MagicItemMaker.MAGICITEMS.FORMULA_RECHARGE, // t1 fixed amount, t2 formula
      rechargeUnit: "", // r1 daily, r2 dawn, r3 sunset, r4vshort rest, r5 long rest
      destroy: false, // destroy on depleted?
      destroyCheck: MagicItemMaker.MAGICITEMS.DestroyCheckAlways, // d1 always, 1d20
      spells: {},
      feats: {},
      tables: {},
      equipped: true,
      attuned: false,
      destroyFlavorText: game.modules.get("magicitems")?.active
        ? game.i18n.localize("MAGICITEMS.MagicItemDestroy")
        : "reaches 0 charges: it crumbles into ashes and is destroyed.",
      sorting: "l",
    };
  }

  static getMagicItemSpells(itemId, chargeType, itemSpells) {
    let spells = {};

    for (let spellIndex = 0, i = 0; i < itemSpells.length; i++) {
      if (itemSpells[i].flags.ddbimporter.dndbeyond.lookupId === itemId) {
        spells[spellIndex] = MagicItemMaker.buildMagicItemSpell(chargeType, itemSpells[i]);
        spellIndex++;
      }
    }

    return spells;
  }

  static checkDestroy(description) {
    let destroy = /expend the .* last charge/i;
    if (description.search(destroy) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  static checkD20Destroy(description) {
    let destroy = /roll a d20.*destroyed/i;
    if (description.search(destroy) !== -1) {
      return MagicItemMaker.MAGICITEMS.DestroyCheck1D20;
    } else {
      return MagicItemMaker.MAGICITEMS.DestroyCheckAlways;
    }
  }

  static buildMagicItemSpell(chargeType, itemSpell) {
    let consumption = chargeType == MagicItemMaker.MAGICITEMS.CHARGE_TYPE_PER_SPELL ? 1 : itemSpell.system.level;
    let castLevel = itemSpell.system.level;
    let upcast = itemSpell.system.level;
    const limitedUse = foundry.utils.getProperty(itemSpell, "flags.ddbimporter.dndbeyond.spellLimitedUse");

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
      limitedUse,
    };
  }

  static parseItemsWithSpellsModule(ddbItem, itemSpells, isCompendiumItem) {

    if (isCompendiumItem) {
      logger.debug("Non character item magic item additions are not supported");
    }

    const thisItemSpells = itemSpells.filter((spell) =>
      spell.flags.ddbimporter.dndbeyond.lookup === "item"
      && spell.flags.ddbimporter.dndbeyond.lookupId === ddbItem.data.flags.ddbimporter.definitionId,
    );

    if (thisItemSpells.length === 0) return;

    const perSpell = ddbItem.parsePerSpellMagicItem(ddbItem.ddbItem.limitedUse?.resetTypeDescription ?? "");

    if (!perSpell
      && (foundry.utils.getProperty(ddbItem.data, "system.uses.max") === null
      || foundry.utils.getProperty(ddbItem.data, "system.uses.max") === "")
    ) {
      ddbItem.data.system.uses = ddbItem._generateUses();
    }

    const iSpells = thisItemSpells.map((itemSpell) => {
      const isPerSpell = Number.isInteger(perSpell);
      const chargeType = isPerSpell
        ? MagicItemMaker.MAGICITEMS.CHARGE_TYPE_PER_SPELL
        : MagicItemMaker.MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM;

      // c1 charge whole item, c2 charge per spells
      const spellData = MagicItemMaker.buildMagicItemSpell(chargeType, itemSpell);

      const resetType = ddbItem.ddbItem.limitedUse?.resetType
        ? DICTIONARY.resets.find((reset) =>
          reset.id == ddbItem.ddbItem.limitedUse.resetType,
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

    ddbItem.data.flags["items-with-spells-5e"] = {
      "item-spells": iSpells,
    };
  }

  static parseMagicItemsModule(ddbItem, itemSpells, isCompendiumItem) {
    // this builds metadata for the magicitems module to use
    // https://gitlab.com/riccisi/foundryvtt-magic-items/

    if (ddbItem.ddbItem.definition.magic) {
      // default magicitem data
      let magicItem = MagicItemMaker.createDefaultMagicItemFlags();
      magicItem.equipped = ddbItem.ddbItem.definition.canEquip;

      const resetType = DDBItem.getMagicItemResetType(ddbItem.ddbItem.definition.description);

      if (isCompendiumItem) {
        const maxUses = /has (\d*) charges/i;
        const maxUsesMatches = maxUses.exec(ddbItem.ddbItem.definition.description);
        const limitedUse = {
          maxUses: (maxUsesMatches && maxUsesMatches[1]) ? maxUsesMatches[1] : null,
          numberUsed: 0,
          resetType,
          resetTypeDescription: ddbItem.ddbItem.definition.description,
        };

        if (limitedUse.maxUses || limitedUse.resetType) ddbItem.ddbItem.limitedUse = limitedUse;
      }

      if (ddbItem.ddbItem.limitedUse) {
        // if the item is x per spell
        const perSpell = ddbItem.parsePerSpellMagicItem(ddbItem.ddbItem.limitedUse.resetTypeDescription);
        if (perSpell) {
          magicItem.charges = 1;
          magicItem.recharge = `1`;
          magicItem.rechargeUnit = MagicItemMaker.MAGICITEMS.DAILY;
          magicItem.rechargeable = true;
          magicItem.rechargeType = MagicItemMaker.MAGICITEMS.NUMERIC_RECHARGE;
          magicItem.chargeType = MagicItemMaker.MAGICITEMS.CHARGE_TYPE_PER_SPELL;
        } else {
          magicItem.charges = ddbItem.ddbItem.limitedUse.maxUses;
          magicItem.recharge = DDBItem.getRechargeFormula(ddbItem.ddbItem.limitedUse.resetTypeDescription, magicItem.charges);

          if (ddbItem.ddbItem.limitedUse.resetType) {
            magicItem.rechargeUnit = DICTIONARY.magicitems.rechargeUnits.find(
              (reset) => reset.id == ddbItem.ddbItem.limitedUse.resetType,
            )?.value ?? "";
          } else {
            magicItem.rechargeUnit = DICTIONARY.magicitems.rechargeUnits.find(
              (reset) => reset.id == resetType,
            )?.value ?? "";
          }
          magicItem.rechargeable = true;
        }

        magicItem.destroy = MagicItemMaker.checkDestroy(ddbItem.ddbItem.limitedUse.resetTypeDescription);
        magicItem.destroyCheck = MagicItemMaker.checkD20Destroy(ddbItem.ddbItem.limitedUse.resetTypeDescription);
      }

      magicItem.spells = MagicItemMaker.getMagicItemSpells(ddbItem.ddbItem.definition.id, magicItem.chargeType, itemSpells);

      return magicItem;
    } else {
      return {
        enabled: false,
      };
    }
  }
}

