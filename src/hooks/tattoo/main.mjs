// A modified version of the spell scroll code from the 5e system

import CreateSpellwroughtTattooDialog from "../../apps/CreateSpellwroughtTattooDialog.js";

/**
 * Create a consumable spell tattoo Item from a spell Item.
 * @param {string} uuid                           UUID of the spell to add to the tattoo.
 * @param {SpellTattooConfiguration} [config={}]  Configuration options for tattoo creation.
 * @returns {Promise<Item5e|void>}                The created tattoo consumable item.
 */
async function createTattooFromCompendiumSpell(uuid, config = {}) {
  const spell = await fromUuid(uuid);
  if (!spell) return undefined;

  const values = {};

  config = foundry.utils.mergeObject({
    level: spell.system.level,
    values,
  }, config);

  if (config.dialog !== false) {
    const result = await new CreateSpellwroughtTattooDialog.create(spell, config);
    if (!result) return undefined;
    foundry.utils.mergeObject(config, result);
  }

  /**
   * A hook event that fires before the item data for a tattoo is created for a compendium spell.
   * @function dnd5e.preCreateTattooFromCompendiumSpell
   * @memberof hookEvents
   * @param {Item5e} spell                     Spell to add to the tattoo.
   * @param {SpellTattooConfiguration} config  Configuration options for tattoo creation.
   * @returns {boolean}                        Explicitly return `false` to prevent the tattoo to be created.
   */
  if (Hooks.call("ddb-importer.preCreateTattooFromSpell", spell, config) === false) return undefined;

  // Get tattoo data
  let tattooUuid;
  const id = CONFIG.DND5E.spellScrollIds[spell.system.level];
  if (foundry.data.validators.isValidId(id)) {
    tattooUuid = game.packs.get(CONFIG.DND5E.sourcePacks.ITEMS).index.get(id).uuid;
  } else {
    tattooUuid = id;
  }
  const tattooItem = await fromUuid(tattooUuid);
  const tattooData = game.items.fromCompendium(tattooItem);

  for (const level of Array.fromRange(spell.system.level + 1).reverse()) {
    const values = CONFIG.DDBI.SPELLWROUGHT_TATTOO[level];
    if (values) {
      config.values.bonus ??= values.bonus;
      config.values.dc ??= values.dc;
      break;
    }
  }

  const activity = {
    _id: dnd5e.utils.staticID("dnd5etattoospell"),
    type: "cast",
    consumption: {
      targets: [{ type: "itemUses", value: "1" }],
    },
    spell: {
      challenge: {
        attack: config.values.bonus,
        save: config.values.dc,
        override: true,
      },
      level: config.level,
      uuid,
    },
  };

  // Create the spell tattoo data
  const spellTattooData = foundry.utils.mergeObject(tattooData, {
    name: `Spellwrought Tatoo: ${spell.name}`,
    img: "icons/tools/scribal/ink-quill-red.webp",
    system: {
      activities: { ...(tattooData.system.activities ?? {}), [activity._id]: activity },
      type: { value: "tattoo" },
    },
  });

  /**
   * A hook event that fires after the item data for a tattoo is created but before the item is returned.
   * @function dnd5e.createTattooFromSpell
   * @memberof hookEvents
   * @param {Item5e} spell                     The spell or item data to be made into a tattoo.
   * @param {object} spellTattooData           The final item data used to make the tattoo.
   * @param {SpellTattooConfiguration} config  Configuration options for tattoo creation.
   */
  Hooks.callAll("ddb-importer.createTattooFromSpell", spell, spellTattooData, config);

  return new Item.implementation(spellTattooData);
}

/**
 * Configuration options for spell tattoo creation.
 *
 * @typedef {object} SpellTattooConfiguration
 * @property {boolean} [dialog=true]                           Present tattoo creation dialog?
 * @property {"full"|"reference"|"none"} [explanation="full"]  Length of spell tattoo rules text to include.
 * @property {number} [level]                                  Level at which the spell should be cast.
 * @property {Partial<SpellTattooValues>} [values]             Spell tattoo DC and attack bonus.
 */

/**
 * Create a consumable spell tattoo Item from a spell Item.
 * @param {Item5e|object} spell                   The spell or item data to be made into a tattoo.
 * @param {object} [options]                      Additional options that modify the created tattoo.
 * @param {SpellTattooConfiguration} [config={}]  Configuration options for tattoo creation.
 * @returns {Promise<Item5e|void>}                The created tattoo consumable item.
 */

// eslint-disable-next-line complexity
async function createTattooFromSpell(spell, options = {}, config = {}) {
  console.warn(spell)
  if (spell.pack) return createTattooFromCompendiumSpell(spell.uuid, config);

  const values = {};

  config = foundry.utils.mergeObject({
    level: spell.system.level,
    values,
  }, config);

  if (config.dialog !== false) {
    const result = await CreateSpellwroughtTattooDialog.create(spell, config);
    if (!result) return undefined;
    foundry.utils.mergeObject(config, result);
  }

  // Get spell data
  const itemData = (spell instanceof dnd5e.documents.Item5e) ? spell.toObject() : spell;
  const flags = itemData.flags ?? {};
  if (Number.isNumeric(config.level)) {
    flags.dnd5e ??= {};
    flags.dnd5e.scaling = Math.max(0, config.level - spell.system.level);
    flags.dnd5e.spellLevel = {
      value: config.level,
      base: spell.system.level,
    };
    itemData.system.level = config.level;
  }

  /**
   * A hook event that fires before the item data for a tattoo is created.
   * @function dnd5e.preCreateTattooFromSpell
   * @memberof hookEvents
   * @param {object} itemData                  The initial item data of the spell to convert to a tattoo.
   * @param {object} options                   Additional options that modify the created tattoo.
   * @param {SpellTattooConfiguration} config  Configuration options for tattoo creation.
   * @returns {boolean}                        Explicitly return false to prevent the tattoo to be created.
   */
  if (Hooks.call("dnd5e.preCreateTattooFromSpell", itemData, options, config) === false) return undefined;

  let { activities, level, properties, source } = itemData.system;

  // Get tattoo data
  let tattooUuid;
  const id = CONFIG.DND5E.spellScrollIds[level];
  if (foundry.data.validators.isValidId(id)) {
    tattooUuid = game.packs.get(CONFIG.DND5E.sourcePacks.ITEMS).index.get(id).uuid;
  } else {
    tattooUuid = id;
  }
  const tattooItem = await fromUuid(tattooUuid);
  const tattooData = game.items.fromCompendium(tattooItem);

  for (const level of Array.fromRange(spell.system.level + 1).reverse()) {
    const values = CONFIG.DDBI.SPELLWROUGHT_TATTOO[level];
    if (values) {
      config.values.bonus ??= values.bonus;
      config.values.dc ??= values.dc;
      break;
    }
  }

  // Apply inferred spell activation, duration, range, and target data to activities
  for (const activity of Object.values(activities)) {
    for (const key of ["activation", "duration", "range", "target"]) {
      if (activity[key]?.override !== false) continue;
      activity[key].override = true;
      foundry.utils.mergeObject(activity[key], itemData.system[key]);
    }
    activity.consumption.targets.push({ type: "itemUses", target: "", value: "1" });
    if (activity.type === "attack") {
      activity.attack.flat = true;
      activity.attack.bonus = values.bonus;
    } else if (activity.type === "save") {
      activity.save.dc.calculation = "";
      activity.save.dc.formula = values.dc;
    }
  }

  // Create the spell tattoo data
  const spellTattooData = foundry.utils.mergeObject(tattooData, {
    name: `Spellwrought Tatoo: ${itemData.name}`,
    img: "icons/tools/scribal/ink-quill-red.webp",
    effects: itemData.effects ?? [],
    flags,
    system: {
      activities, properties, source,
      type: { value: "tattoo" },
    },
  });
  foundry.utils.mergeObject(spellTattooData, options);
  spellTattooData.system.properties = [
    "mgc",
    ...tattooData.system.properties,
    ...properties ?? [],
    ...options.system?.properties ?? [],
  ];

  /**
   * A hook event that fires after the item data for a tattoo is created but before the item is returned.
   * @function dnd5e.createTattooFromSpell
   * @memberof hookEvents
   * @param {Item5e|object} spell              The spell or item data to be made into a tattoo.
   * @param {object} spellTattooData           The final item data used to make the tattoo.
   * @param {SpellTattooConfiguration} config  Configuration options for tattoo creation.
   */
  Hooks.callAll("dnd5e.createTattooFromSpell", spell, spellTattooData, config);

  return new Item.implementation(spellTattooData);
}


function compendiumContext(app, options) {

  options.push({
    name: "Create Spellwrought Tattoo",
    icon: '<i class="fa-solid fa-scribble"></i>',
    callback: async (li) => {
      let spell = game.items.get(li.dataset.documentId ?? li.dataset.entryId);
      if (app.collection instanceof foundry.documents.collections.CompendiumCollection) {
        spell = game.items.get(li.dataset.documentId ?? li.dataset.entryId);
      }
      const tattoo = await createTattooFromSpell(spell);
      if (tattoo) dnd5e.documents.Item5e.create(tattoo);
    },
    condition: (li) => {
      let item = game.items.get(li.dataset.documentId ?? li.dataset.entryId);
      if (app.collection instanceof foundry.documents.collections.CompendiumCollection) {
        item = app.collection.index.get(li.dataset.entryId);
      }
      return (item.type === "spell") && game.user.hasPermission("ITEM_CREATE");
    },
    group: "system",
  });

}

function addCharacterSheetContext(doc, buttons) {
  if (doc.type !== "spell") return;
  if (doc.system.level > 5) return;
  buttons.push({
    name: "Create Spellwrought Tattoo",
    icon: "<i class='fa-solid fa-scribble'></i>",
    callback: () => createTattooFromSpell(doc),
    condition: () => doc.actor?.isOwner,
    group: "action",
  });
}

function wrappedValidProperties(original) {
  let properties = original();

  // eslint-disable-next-line no-invalid-this
  if (this.parent.type === "consumable" && this.type.value === "tattoo") CONFIG.DND5E.validProperties.spell
    .filter((p) => p !== "material").forEach((p) => properties.add(p));
  return properties;
}


/**
 * Registers a new consumable type "tattoo" to the DND5E configuration with specific levels, rarity, ability modifiers, DC values, and bonuses.
 * This function also registers hooks to add context options for items and character sheets.
 * The tattoo consumable type is defined as a spellwrought tattoo, which is a consumable that grants a bonus to spellcasting.
 * @returns {void}
 */
export function addTattooConsumable() {
  if (!foundry.utils.isNewerVersion(game.version, "13")) return;
  if (game.modules.get("dnd-tashas-cauldron")?.active) return;
  CONFIG.DND5E.consumableTypes["tattoo"] = {
    label: "Spellwrought Tattoo",
  };

  CONFIG.DDBI.SPELLWROUGHT_TATTOO = [
    { level: 0, rarity: "common", abilityMod: 3, dc: 13, bonus: 5 },
    { level: 1, rarity: "common", abilityMod: 3, dc: 13, bonus: 5 },
    { level: 2, rarity: "uncommon", abilityMod: 3, dc: 13, bonus: 5 },
    { level: 3, rarity: "uncommon", abilityMod: 4, dc: 15, bonus: 7 },
    { level: 4, rarity: "rare", abilityMod: 4, dc: 15, bonus: 7 },
    { level: 5, rarity: "rare", abilityMod: 5, dc: 17, bonus: 9 },
  ];

  game.modules.get("ddb-importer").api.libWrapper.register(
    "ddb-importer",
    "dnd5e.dataModels.item.ConsumableData.prototype.validProperties",
    wrappedValidProperties,
    "WRAPPER",
  );

  // v13hooks
  //  compendium
  Hooks.on("getItemContextOptions", compendiumContext);

  // character sheet option
  Hooks.on("dnd5e.getItemContextOptions", addCharacterSheetContext);

  // TODO: move to cast activity
  // Add v12 support
  // Should properties be a reduced set?
}
