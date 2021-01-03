// Modified from https://gitlab.com/tposney/dae/-/blob/master/src/module/migration.ts

// MIT License

// Copyright (c) 2020 Tim Posney

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import logger from "../logger.js";
import utils from "../utils.js";

var packsLoaded = false;
var itemPack;
var spellPack;
var featsPack;
var midiPack;
var magicItemsPack;


export async function loadPacks() {
  if (packsLoaded) return;
  itemPack = await game.packs.get("Dynamic-Effects-SRD.DAE SRD Items").getContent();
  spellPack = await game.packs.get("Dynamic-Effects-SRD.DAE SRD Spells").getContent();
  featsPack = await game.packs.get("Dynamic-Effects-SRD.DAE SRD Feats").getContent();
  midiPack = await game.packs.get("Dynamic-Effects-SRD.DAE SRD Midi-collection").getContent();
  magicItemsPack = await game.packs.get("Dynamic-Effects-SRD.DAE SRD Magic Items").getContent();
  // eslint-disable-next-line require-atomic-updates
  packsLoaded = true;
}

function findDAEItem(itemData, packs) {
  for (let pack of packs) {
    let matchItem = pack.find((pd) =>
      pd.name === itemData.name &&
      pd.type === itemData.type
    );
    if (matchItem) return matchItem;
  }
  return undefined;
}

function dataSwap(itemData, replaceData) {
  if (itemData.data.quantity) replaceData.data.quantity = itemData.data.quantity;
  if (itemData.data.attuned) replaceData.data.attuned = itemData.data.attuned;
  if (itemData.data.equipped) replaceData.data.equipped = itemData.data.equipped;
  if (itemData.data.uses) replaceData.data.uses = itemData.data.uses;
  if (itemData.data.resources) replaceData.data.resources = itemData.data.resources;
  if (itemData.data.consume) replaceData.data.consume = itemData.data.consume;
  if (itemData.data.preparation) replaceData.data.preparation = itemData.data.preparation;
  if (itemData.data.proficient) replaceData.data.proficient = itemData.data.proficient;
  if (itemData.data.ability) replaceData.data.ability = itemData.data.ability;
  if (itemData._id) replaceData._id = itemData._id;
  return replaceData;
}

export async function migrateItemsDAESRD(items) {
  if (!packsLoaded) await loadPacks();
  const midiInstalled = utils.isModuleInstalledAndActive("midi-qol");

  return new Promise((resolve) => {
    resolve(
      items.map((itemData) => {
        let replaceData;
        switch (itemData.type) {
          case "feat": {
            const featPacks = (midiInstalled) ? [midiPack, featsPack] : [featsPack];
            replaceData = findDAEItem(itemData, featPacks);
            if (replaceData) logger.debug(`migrating${replaceData.data.name}`);
            if (replaceData) {
              setProperty(replaceData.data.flags, "dae.migrated", true);
              return dataSwap(itemData, replaceData.data);
            }
            break;
          }
          case "spell": {
            const spellPacks = (midiInstalled) ? [midiPack, spellPack] : [spellPack];
            replaceData = findDAEItem(itemData, spellPacks);
            if (replaceData) logger.debug(`migrating ${replaceData.data.name}`);
            if (replaceData) {
              setProperty(replaceData.data.flags, "dae.migrated", true);
              return dataSwap(itemData, replaceData.data);
            }
            break;
          }
          case "equipment":
          case "weapon":
          case "loot":
          case "consumable":
          case "tool":
          case "backpack": {
            const equipmentPacks = (midiInstalled) ? [midiPack, itemPack, magicItemsPack] : [itemPack, magicItemsPack];
            replaceData = findDAEItem(itemData, equipmentPacks);
            if (replaceData) logger.debug(`migrating ${replaceData.data.name}`);
            if (replaceData) {
              setProperty(replaceData.data.flags, "dae.migrated", true);
              return dataSwap(itemData, replaceData.data);
            }
            break;
          }
          default:
            break;
        }
        return itemData;
      })
    );
  });
}


export async function addItemsDAESRD(items) {
  // eslint-disable-next-line require-atomic-updates
  if (!packsLoaded) await loadPacks();
  return new Promise((resolve) => {
    resolve(
      items.map((itemData) => {
        let replaceData;
        switch (itemData.type) {
          case "feat":
            replaceData = findDAEItem(itemData, [midiPack, featsPack]);
            if (replaceData) logger.debug(`Adding effects for ${replaceData.data.name}`);
            if (replaceData) itemData.effects = replaceData.data.effects;
            break;
          case "spell":
            replaceData = findDAEItem(itemData, [midiPack, spellPack]);
            if (replaceData) logger.debug(`Adding effects for  ${replaceData.data.name}`);
            if (replaceData) itemData.effects = replaceData.data.effects;
            break;
          case "equipment":
          case "weapon":
          case "loot":
          case "consumable":
          case "tool":
          case "backpack":
            replaceData = findDAEItem(itemData, [midiPack, itemPack, magicItemsPack]);
            if (replaceData) logger.debug(`Adding effects for  ${replaceData.data.name}`);
            if (replaceData) itemData.effects = replaceData.data.effects;
            break;
          default:
            break;
        }
        return itemData;
      })
    );
  });
}


export async function migrateActorDAESRD(actor) {
  if (!packsLoaded) await loadPacks();
  const items = actor.data.items;
  let replaceItems = [];
  let count = 0;
  items.forEach((itemData) => {
    let replaceData;
    switch (itemData.type) {
      case "feat":
        replaceData = findDAEItem(itemData, [midiPack, featsPack]);
        if (replaceData) logger.debug(`migrating ${actor.name} ${replaceData.name}`);
        if (replaceData) {
          setProperty(replaceData.data.flags, "dae.migrated", true);
          replaceItems.push(dataSwap(itemData, replaceData.data));
          count++;
        } else replaceItems.push(itemData);
        break;
      case "spell":
        replaceData = findDAEItem(itemData, [midiPack, spellPack]);
        if (replaceData) logger.debug(`migrating ${actor.name} ${replaceData.name}`);
        if (replaceData) {
          setProperty(replaceData.data.flags, "dae.migrated", true);
          replaceItems.push(dataSwap(itemData, replaceData.data));
          count++;
        } else replaceItems.push(itemData);
        break;
      case "equipment":
      case "weapon":
      case "loot":
      case "consumable":
      case "tool":
      case "backpack":
        replaceData = findDAEItem(itemData, [midiPack, itemPack, magicItemsPack]);
        if (replaceData) logger.debug(`migrating ${actor.name} ${replaceData.name}`);
        if (replaceData) {
          setProperty(replaceData.data.flags, "dae.migrated", true);
          replaceItems.push(dataSwap(itemData, replaceData.data));
          count++;
        } else replaceItems.push(itemData);
        break;
      default:
        replaceItems.push(itemData);
        break;
    }
  });
  let removeItems = actor.items.map((i) => i.id);
  await actor.deleteOwnedItem(removeItems);
  await actor.deleteEmbeddedEntity("ActiveEffect", actor.effects.map((ae) => ae.id));
  await actor.createOwnedItem(replaceItems);
  logger.debug(`${actor.name} replaced ${count} out of ${replaceItems.length} items from the DAE SRD`);
}
