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
import { updateCharacterItemFlags } from "./import.js";

var packsLoaded = false;
var itemPack;
var spellPack;
var featsPack;
var midiPack;
var magicItemsPack;
var midiItemsPack;
var midiSpellsPack;
var midiFeatsPack;


export async function loadPacks() {
  if (packsLoaded) return;
  const items = game.packs.get("Dynamic-Effects-SRD.DAE SRD Items");
  itemPack = items ? await items.getDocuments() : [];

  const spells = game.packs.get("Dynamic-Effects-SRD.DAE SRD Spells");
  spellPack = spells ? await spells.getDocuments() : [];

  const magicItems = game.packs.get("Dynamic-Effects-SRD.DAE SRD Magic Items");
  magicItemsPack = magicItems ? await magicItems.getDocuments() : [];

  const feats = game.packs.get("Dynamic-Effects-SRD.DAE SRD Feats");
  featsPack = feats ? await feats.getDocuments() : [];

  const srdMidi = game.packs.get("Dynamic-Effects-SRD.DAE SRD Midi-collection");
  midiPack = srdMidi ? await srdMidi.getDocuments() : [];

  const midiItems = game.packs.get("midi-srd.Midi SRD Items");
  midiItemsPack = midiItems ? await midiItems.getDocuments() : [];
  const midiSpells = game.packs.get("midi-srd.Midi SRD Spells");
  midiSpellsPack = midiSpells ? await midiSpells.getDocuments() : [];
  const midiFeats = game.packs.get("midi-srd.Midi SRD Feats");
  midiFeatsPack = midiFeats ? await midiFeats.getDocuments() : [];

  // eslint-disable-next-line require-atomic-updates
  packsLoaded = true;
}

function findDAEItem(itemData, packs) {
  for (let pack of packs) {
    let matchItem = pack.find((pd) =>
      pd.name === itemData.name &&
      pd.type === itemData.type
    );
    // console.warn(itemData.name);
    // console.warn(matchItem);
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

function matchItem(itemData) {
  // we only add the midi packs if midi is actually installed
  let returnItem = null;
  switch (itemData.type) {
    case "feat": {
      const featPacks = [midiFeatsPack, midiPack, featsPack];
      returnItem = findDAEItem(itemData, featPacks);
      break;
    }
    case "spell": {
      const spellPacks = [midiSpellsPack, midiPack, spellPack];
      returnItem = findDAEItem(itemData, spellPacks);
      break;
    }
    case "equipment":
    case "weapon":
    case "loot":
    case "consumable":
    case "tool":
    case "backpack": {
      const equipmentPacks = [midiItemsPack, midiPack, itemPack, magicItemsPack];
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

  return new Promise((resolve) => {
    resolve(
      items.map((itemData) => {
        let replaceData = matchItem(itemData);
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

  return new Promise((resolve) => {
    resolve(
      items.map((itemData) => {
        let replaceData = matchItem(itemData);
        if (replaceData) {
          replaceData = replaceData.data.toObject();
          logger.debug(`Adding effects for ${replaceData.name}`);
          itemData.effects = replaceData.effects;
          if (replaceData.flags.dae) itemData.flags.dae = replaceData.flags.dae;
          if (replaceData.flags['midi-qol']) itemData.flags['midi-qol'] = replaceData.flags['midi-qol'];
          if (replaceData.flags.itemacro) itemData.flags.itemacro = replaceData.flags.itemacro;
          if (replaceData.flags.itemmacro) itemData.flags.itemmacro = replaceData.flags.itemmacro;
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
  await DAE.migrateActorDAESRD(actor, includeSRD);
}
