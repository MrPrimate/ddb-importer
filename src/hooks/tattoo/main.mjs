// A modified version of the spell scroll code from the 5e system

import CreateSpellwroughtTattooDialog from "../../apps/CreateSpellwroughtTattooDialog.js";
import { utils } from "../../lib/_module.mjs";
import CompendiumHelper from "../../lib/CompendiumHelper.mjs";

async function getBaseTattooData(level) {
  const spellWroughtIdentity = CONFIG.DDBI.SPELLWROUGHT_TATTOO[level]?.identity;

  let tattooUuid;

  // check for munched spell wrought item
  if (spellWroughtIdentity) {
    const ddbCompendium = CompendiumHelper.getCompendiumType("items");
    await CompendiumHelper.loadCompendiumIndex("items", {
      fields: ["name", "system.identifier"],
    });
    const indexMatch = ddbCompendium.index.find((i) => i.system?.identifier?.startsWith(spellWroughtIdentity));
    if (indexMatch) tattooUuid = indexMatch.uuid;
  }
  // fallback to scroll item
  if (!tattooUuid) {
    const id = CONFIG.DND5E.spellScrollIds[level];
    if (foundry.data.validators.isValidId(id)) {
      tattooUuid = game.packs.get(CONFIG.DND5E.sourcePacks.ITEMS).index.get(id).uuid;
    } else {
      tattooUuid = id;
    }
  }
  const tattooItem = await fromUuid(tattooUuid);
  const tattooData = game.items.fromCompendium(tattooItem);
  return tattooData;
}

/**
 * Create a consumable spell tattoo Item from a spell Item.
 * @param {string} uuid                           UUID of the spell to add to the tattoo.
 * @param {SpellTattooConfiguration} [config={}]  Configuration options for tattoo creation.
 * @returns {Promise<Item5e|void>}                The created tattoo consumable item.
 */
async function createTattooFromSpellUuid(uuid, config = {}) {
  const spell = await fromUuid(uuid);
  if (!spell) return undefined;

  const values = CONFIG.DDBI.SPELLWROUGHT_TATTOO[spell.system.level];

  config = foundry.utils.mergeObject({
    level: spell.system.level,
    values,
  }, config);

  if (config.dialog !== false) {
    const result = await CreateSpellwroughtTattooDialog.create(spell, config);
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
  const tattooData = await getBaseTattooData(config.level);

  for (const level of Array.fromRange(config.level + 1).reverse()) {
    const values = CONFIG.DDBI.SPELLWROUGHT_TATTOO[level];
    if (values) {
      config.values.bonus ??= values.bonus;
      config.values.dc ??= values.dc;
      config.values.abilityMod ??= values.abilityMod;
      config.name ??= values.name;
      break;
    }
  }

  // If this is apell scroll fallback then clear description
  if (tattooData.system.type.value === "scroll") {
    tattooData.system.description.value = `
<p>The tattoo casts ${spell.name} as a ${config.name} spell with the following properties:</p>

<p>
<strong>Ability Modifier</strong>: ${utils.intSigner(config.values.abilityMod)}<br>
<strong>Save DC</strong>: ${config.values.dc}<br>
<strong>Attack Bonus</strong>: ${utils.intSigner(config.values.bonus)}
</p>
`;
  }
  const activity = {
    _id: dnd5e.utils.staticID("ddbitattoospell"),
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
      uuid: spell.uuid,
      properties: ["material"],
    },
  };

  // Create the spell tattoo data
  const spellTattooData = foundry.utils.mergeObject(tattooData, {
    name: `Spellwrought Tattoo: ${spell.name} (${config.name})`,
    img: "icons/tools/scribal/ink-quill-red.webp",
    system: {
      uses: { spent: 0, max: "1", autoDestroy: true },
      activities: { ...(tattooData.system.activities ?? {}), [activity._id]: activity },
      properties: ["mgc"],
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


async function compendiumContext(app, options) {
  if (!game.user.hasPermission("ITEM_CREATE")) return;

  if (app.collection instanceof foundry.documents.collections.CompendiumCollection) {
    await app.collection.getIndex({
      fields: ["name", "system.level", "system.identifier"],
    });
  }

  const getSpellDetailsFromLi = (li) => {
    let spell = game.items.get(li.dataset.documentId ?? li.dataset.entryId);
    if (app.collection instanceof foundry.documents.collections.CompendiumCollection) {
      let indexSpell = app.collection.index.get(li.dataset.entryId);
      if (!indexSpell) return false;
      spell = fromUuidSync(indexSpell.uuid);
      if (!spell) return false;
    }
    return spell;
  };

  options.push({
    name: "Create Spellwrought Tattoo",
    icon: '<i class="fa-solid fa-user-pen"></i>',
    callback: async (li) => {
      let spell = getSpellDetailsFromLi(li);
      const tattoo = await createTattooFromSpellUuid(spell.uuid);
      if (tattoo) dnd5e.documents.Item5e.create(tattoo);
    },
    condition: (li) => {
      let spell = getSpellDetailsFromLi(li);
      return spell.type === "spell"
        && spell.system.level <= 5;
    },
    group: "system",
  });

}

function addCharacterSheetContext(doc, buttons) {
  if (doc.type !== "spell") return;
  if (doc.system.level > 5) return;
  buttons.push({
    name: "Create Spellwrought Tattoo",
    icon: "<i class='fa-solid fa-user-pen'></i>",
    callback: async () => {
      const tattoo = await createTattooFromSpellUuid(doc.uuid);
      if (tattoo) doc.actor.createEmbeddedDocuments("Item", [tattoo]);
    },
    condition: () => doc.actor?.isOwner,
    group: "action",
  });
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
    { level: 0, rarity: "common", abilityMod: 3, dc: 13, bonus: 5, identity: "spellwrought-tattoo-cantrip", name: "Cantrip" },
    { level: 1, rarity: "common", abilityMod: 3, dc: 13, bonus: 5, identity: "spellwrought-tattoo-1st-level", name: "1st Level" },
    { level: 2, rarity: "uncommon", abilityMod: 3, dc: 13, bonus: 5, identity: "spellwrought-tattoo-2nd-level", name: "2nd Level" },
    { level: 3, rarity: "uncommon", abilityMod: 4, dc: 15, bonus: 7, identity: "spellwrought-tattoo-3rd-level", name: "3rd Level" },
    { level: 4, rarity: "rare", abilityMod: 4, dc: 15, bonus: 7, identity: "spellwrought-tattoo-4th-level", name: "4th Level" },
    { level: 5, rarity: "rare", abilityMod: 5, dc: 17, bonus: 9, identity: "spellwrought-tattoo-5th-level", name: "5th Level" },
  ];

  // game.modules.get("ddb-importer").api.libWrapper.register(
  //   "ddb-importer",
  //   "dnd5e.dataModels.item.ConsumableData.prototype.validProperties",
  //   wrappedValidProperties,
  //   "WRAPPER",
  // );

  // v13hooks
  // items tab
  Hooks.on("getItemContextOptions", compendiumContext);

  // character sheet option
  Hooks.on("dnd5e.getItemContextOptions", addCharacterSheetContext);

  // Add v12 support
}
