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
import { updateCharacterItemFlags } from "./import.js";

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
  updateCharacterItemFlags(itemData, replaceData);
  if (itemData._id) replaceData._id = itemData._id;
  if (itemData.flags) replaceData.flags = { ...itemData.flags, ...replaceData.flags };
  return replaceData;
}

function matchItem(itemData, midiInstalled) {
  let returnItem = null;
  switch (itemData.type) {
    case "feat": {
      const featPacks = (midiInstalled) ? [midiPack, featsPack] : [featsPack];
      returnItem = findDAEItem(itemData, featPacks);
      break;
    }
    case "spell": {
      const spellPacks = (midiInstalled) ? [midiPack, spellPack] : [spellPack];
      returnItem = findDAEItem(itemData, spellPacks);
      break;
    }
    case "equipment":
    case "weapon":
    case "loot":
    case "consumable":
    case "tool":
    case "backpack": {
      const equipmentPacks = (midiInstalled) ? [midiPack, itemPack, magicItemsPack] : [itemPack, magicItemsPack];
      returnItem = findDAEItem(itemData, equipmentPacks);
      break;
    }
    default:
      break;
  }
  return returnItem;
}


/**
 * Migrates items wholesale
 * @param {*} items
 */
export async function migrateItemsDAESRD(items) {
  if (!packsLoaded) await loadPacks();
  const midiInstalled = utils.isModuleInstalledAndActive("midi-qol");

  return new Promise((resolve) => {
    resolve(
      items.map((itemData) => {
        let replaceData = matchItem(itemData, midiInstalled);
        if (replaceData) {
          logger.debug(`migrating ${replaceData.data.name}`);
          setProperty(replaceData.data.flags, "dae.migrated", true);
          return dataSwap(itemData, replaceData.data);
        }
        return itemData;
      })
    );
  });
}

/**
 * Adds dae effects to existing items
 * @param {*} items
 */
export async function addItemsDAESRD(items) {
  // eslint-disable-next-line require-atomic-updates
  if (!packsLoaded) await loadPacks();
  const midiInstalled = utils.isModuleInstalledAndActive("midi-qol");

  return new Promise((resolve) => {
    resolve(
      items.map((itemData) => {
        let replaceData = matchItem(itemData, midiInstalled);
        if (replaceData) {
          logger.debug(`Adding effects for ${replaceData.data.name}`);
          itemData.effects = replaceData.data.effects;
        }
        return itemData;
      })
    );
  });
}

/**
 * Replaces matching items in an actor
 * @param {*} actor
 */
export async function migrateActorDAESRD(actor, includeSRD = false) {
  // if (!packsLoaded) await loadPacks();
  // const midiInstalled = utils.isModuleInstalledAndActive("midi-qol");

  // const items = actor.data.items;
  // let replaceItems = [];
  // let count = 0;
  // items.forEach((itemData) => {
  //   let replaceData = matchItem(itemData, midiInstalled);

  //   if (replaceData) {
  //     logger.debug(`migrating ${actor.name} ${replaceData.name}`);
  //     setProperty(replaceData.data.flags, "dae.migrated", true);
  //     replaceItems.push(dataSwap(itemData, replaceData.data));
  //     count++;
  //   } else replaceItems.push(itemData);
  // });
  // let removeItems = actor.items.map((i) => i.id);
  // await actor.deleteOwnedItem(removeItems);
  // console.warn(actor.effects.map((ae) => ae.id));
  // await actor.deleteEmbeddedEntity("ActiveEffect", actor.effects.map((ae) => ae.id));
  // await actor.createOwnedItem(replaceItems);
  // logger.debug(`${actor.name} replaced ${count} out of ${replaceItems.length} items from the DAE SRD`);
  await DAE.migrateActorDAESRD(actor, includeSRD);
}
