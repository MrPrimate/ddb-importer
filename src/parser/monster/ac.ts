import { logger, DDBItemImporter, utils, CompendiumHelper } from "../../lib/_module";
import DDBMonster from "../DDBMonster";
import ACBonusEffects from "../enrichers/effects/ACBonusEffects";
import ChangeHelper from "../enrichers/effects/ChangeHelper";

DDBMonster.prototype.BAD_AC_MONSTERS = ["arkhan the cruel"];


DDBMonster.prototype._generateAC = async function _generateAC(this: DDBMonster, additionalItems: string[] = []) {
  const attributes = this.npc.system.attributes;
  const ddbimporterFlags = this.npc.flags?.ddbimporter;
  if (!attributes || !ddbimporterFlags) {
    logger.warn(`_generateAC: missing npc attributes or importer flags for ${this.source.name}`);
    return;
  }

  const originalAc = parseInt(String(this.source.armorClass));
  // dnd5e 6.0 shape: the system evaluates calcs/formulas against equipped items
  // and takes the max; `ac.label` is derived now and no longer written.
  const ac: I5eArmorClass = {
    calcs: [],
    formulas: [],
    flat: originalAc,
    override: null,
  };
  // tracks the prose-derived natural-armor state that used to live in ac.calc
  let natural = false;

  let flatAC = true;

  const stat = this.source.stats.find((stat) => stat.statId === 2)?.value || 10;
  const statModifier = CONFIG.DDB.statModifiers.find((s) => s.value == stat);
  if (!statModifier) {
    logger.warn(`_generateAC: no stat modifier found for stat value ${stat} on ${this.source.name}`);
  }
  const dexBonus = statModifier?.modifier ?? 0;
  const baseAc = 10 + dexBonus;

  const lowerDescription = this.source.armorClassDescription ? this.source.armorClassDescription.toLowerCase() : "";
  const descriptionItems = this.source.armorClassDescription
    ? this.source.armorClassDescription
      .replace("(", "")
      .replace(")", "")
      .split(";")[0]
      .split(",")
      .map((item) => item.trim())
    : [];

  // arkhan the cruel has Armor Class 23 (obsidian flint dragon plate, shield)

  // archmage 12 (15 with mage armor)

  // Jarlaxle Baenre 24 (+3 leather armor, Suave Defense)
  // Suave Defense. While Jarlaxle is wearing light or no armor and wielding no shield, his AC includes his Charisma modifier.

  // Eternal flame guardian 17 (breastplate, shield; 15 while using a crossbow)

  const itemsToCheck: DeepPartial<I5eEquipmentItem[]> = [];
  descriptionItems.push(...additionalItems);

  if (descriptionItems.length > 0) {

    descriptionItems.forEach((item) => {
      let lowerItem = item.toLowerCase();
      if (lowerItem == "natural" || lowerItem == "natural armor") {
        natural = true;
        flatAC = false;

        let flat = ac.flat ?? originalAc;
        if (lowerDescription.includes("shield")) flat -= 2;
        if (lowerDescription.includes("ring of protection")) flat -= 1;
        if (lowerDescription.includes("cloak of protection")) flat -= 1;
        if (lowerDescription.includes("+1") || lowerDescription.includes("+ 1")) flat -= 1;
        if (lowerDescription.includes("+2") || lowerDescription.includes("+ 2")) flat -= 2;
        if (lowerDescription.includes("+3") || lowerDescription.includes("+ 3")) flat -= 3;
        ac.flat = flat;
      } else if (!lowerItem.includes("with mage armor")) {
        lowerItem = lowerItem
          .replace("leather armor", "leather")
          .replace("hide armor", "hide")
          .replace("plate mail", "plate")
          .replace("plate armor", "plate")
          .replace("breastplate armor", "breastplate");
        if (lowerItem.startsWith("+")) {
          const bonusRegex = /(\+\d+)(?:\s+)(.*)/;
          const matches = lowerItem.match(bonusRegex);
          if (matches) {
            lowerItem = `${matches[2]}, ${matches[1]}`;
          }
        }
        // const type = item.includes("ring") || item.includes("cloak") ? "trinket" : "equipment";
        const itemsToIgnore = this.addMonsterEffects ? ["suave defense"] : [];
        if (!itemsToIgnore.includes(lowerItem)) {
          const quantityRegex = /(.*) \((\d+)\)/;
          const match = lowerItem.match(quantityRegex);
          const name = match ? match[1] : lowerItem;
          const quantity = match ? parseInt(match[2]) : 1;
          if (name && name != "") itemsToCheck.push({
            name: (match ? name.replace(` (${quantity})`, "") : name)
              .split(" ")
              .map((word) => utils.capitalize(word))
              .join(" "),
            type: "equipment",
            flags: {
              ddbimporter: {
                is2014: this.is2014,
                is2024: this.is2024,
              },
            },
            system: {
              quantity,
              equipped: true,
              source: {
                rules: this.is2014 ? "2014" : "2024",
              },
            },
          });
        }
      }
    });
  }

  logger.debug("Checking for items", itemsToCheck);
  const rawItems: I5eMonsterItem[] = await DDBItemImporter.getCompendiumItems(itemsToCheck as unknown as TAll5eDocuments[], "inventory", {
    looseMatch: true,
    monsterMatch: true,
    // shared 2014/2024 gear (e.g. Plate) is only munched under one rules version
    rulesFallback: true,
  }) as I5eMonsterItem[];
  const adjustedItems = rawItems
    .filter((item) => item.type !== "weapon")
    .map((item) => {
      if ("attunement" in item.system && item.system.attunement === "required") item.system.attuned = true;
      if (foundry.utils.hasProperty(item, "system.equipped")) item.system.equipped = true;
      const check = itemsToCheck.find((i) => i?.name?.toLowerCase() === item.name.toLowerCase());
      if (check?.system && "quantity" in item.system) {
        item.system.quantity = check.system.quantity ?? 1;
      }
      return item;
    });

  const acItems = adjustedItems.filter((i) => {
    if (!("type" in i.system)) return false;
    if (["light", "medium", "heavy", "shield"].includes(i.system.type.value)) return true;
    if (i.system.type.value === "trinket") {
      const effectHasACChanges = (i.effects ?? []).some((e) => {
        const changeACKey = (e.system?.changes ?? []).some((c) => c.key.includes("system.attributes.ac"));
        return changeACKey;
      });
      if (effectHasACChanges) return true;
    }
    return false;
  });

  // update weapons imported as features with quantity
  for (const item of this.items) {
    if (item.type !== "weapon") continue;
    const check = itemsToCheck.find((i) => i?.name?.toLowerCase() === item.name.toLowerCase());
    if (check?.system) {
      item.system.quantity = check.system.quantity ?? 1;
    }
  }

  logger.debug("Found items", { adjustedItems, rawItems });
  const allItemsMatched = adjustedItems.length > 0 && adjustedItems.length == itemsToCheck.length;
  const badACMonster = this.BAD_AC_MONSTERS.includes(this.source.name.toLowerCase());


  const spellCastingAC = this.items.find(
    (i) => i.name.includes("Spellcasting") && i.system.description.value.includes("Mage Armor (included in AC)"),
  );

  const effects: I5eEffectData[] = [];

  if (spellCastingAC) {
    const compendium = CompendiumHelper.getCompendiumLabel("monster");
    effects.push({
      img: "icons/equipment/chest/breastplate-helmet-metal.webp",
      name: "Mage Armor",
      statuses: [],
      system: {
        changes: [
          ChangeHelper.acCalcsAddChange("mage", 5),
        ],
      },
      duration: {
        value: 8,
        units: "hours",
      },
      transfer: false,
      disabled: false,
      flags: {
        dae: {
          transfer: false,
          stackable: "noneNameOnly",
          specialDuration: [],
        },
        dnd5e: {
          spellLevel: 1,
        },
      },
      _id: "Md6K6TE3a5buYstn",
      type: "base",
      origin: `Compendium.${compendium}.Actor.${this.npc._id}.Item.${spellCastingAC._id}`,
    });
    const maAC = 13 + dexBonus;
    if (acItems.length === 0 && (ac.flat ?? 0) > maAC) {
      const effect = ACBonusEffects.ACEffect("AC Bonus");
      effect.disabled = false;
      effect.transfer = true;
      effect.system ??= {};
      effect.system.changes ??= [];
      effect.system.changes.push({
        key: "system.attributes.ac.bonus",
        value: `${(ac.flat ?? 0) - maAC}`,
        type: "add",
        priority: 30,
      });
      effects.push(effect);
    }
  }

  let useDefaultCalcs = false;
  if (acItems.length === 0 && !natural && baseAc !== ac.flat) {
    // some kind o bonus in play, set to natural
    natural = true;
    flatAC = false;
  } else if (this.useItemAC && !natural && !badACMonster) {
    // items drive the AC: the system computes from the equipped armor
    ac.flat = null;
    useDefaultCalcs = true;
    flatAC = false;
  } else if ((!this.useItemAC && !natural) || adjustedItems.length === 0) {
    // default monsters with no ac equipment to natural
    natural = true;
    flatAC = false;
  }

  // emit the dnd5e 6.0 calcs. Natural uses flat (base = flat, shield/bonus/cover
  // still stack); the residual flatAC case (badACMonster with matched items -
  // DDB's number cannot be reconciled) hard-overrides so nothing stacks on top.
  if (natural) {
    ac.calcs = ["natural"];
  } else if (useDefaultCalcs) {
    ac.calcs = ["unarmored", "armored"];
  } else {
    ac.calcs = ["unarmored", "armored"];
    ac.override = ac.flat ?? originalAc;
    ac.flat = null;
  }

  this.npc.effects ??= [];
  this.npc.effects.push(...effects);

  this.ac = {
    ac,
    flatAC,
    acItems,
    dexBonus,
    ddbItems: this.useItemAC ? adjustedItems : [], // only add items if we are told too
    adjustedItems,
    allItemsMatched,
    badACMonster,
    rawItems,
    effects,
  };

  logger.debug(`${this.source.name} ac calcs`, this.ac);
  attributes.ac = ac;
  ddbimporterFlags.flatAC = flatAC;
  if (this.useItemAC) this.items.push(...adjustedItems);

};
