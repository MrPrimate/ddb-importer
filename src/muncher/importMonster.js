// import {
//   logger,
//   utils,
//   Iconizer,
//   DDBItemImporter,
//   FileHelper,
//   CompendiumHelper,
// } from "../lib/_module.mjs";
// import { SETTINGS } from "../config/_module.mjs";

// // check items to see if retaining item, img or resources
// async function existingItemRetentionCheck(currentItems, newItems, checkId = true) {
//   const returnItems = [];

//   await newItems.forEach((item) => {
//     const existingItem = currentItems.find((owned) => {
//       const simpleMatch
//         = item.name === owned.name
//         && item.type === owned.type
//         // && item.system.activation?.type === owned.system.activation?.type
//         && ((checkId && item.flags?.ddbimporter?.id === owned.flags?.ddbimporter?.id) || !checkId);

//       return simpleMatch;
//     });

//     if (existingItem) {
//       if (existingItem.flags.ddbimporter?.ignoreItemImport) {
//         returnItems.push(foundry.utils.duplicate(existingItem));
//       } else {
//         item["_id"] = existingItem.id;
//         if (foundry.utils.getProperty(existingItem, "flags.ddbimporter.ignoreIcon") === true) {
//           item.img = existingItem.img;
//           foundry.utils.setProperty(item, "flags.ddbimporter.ignoreIcon", true);
//         }
//         if (foundry.utils.getProperty(existingItem, "flags.ddbimporter.retainResourceConsumption")) {
//           item.system.consume = existingItem.system.consume;
//           item.system.uses.recovery = existingItem.system.uses.recovery;
//           foundry.utils.setProperty(item, "flags.ddbimporter.retainResourceConsumption", true);
//           if (foundry.utils.hasProperty(existingItem, "flags.link-item-resource-5e")) {
//             foundry.utils.setProperty(item, "flags.link-item-resource-5e", existingItem.flags["link-item-resource-5e"]);
//           }
//         }

//         if (!item.effects
//           || (item.effects && item.effects.length == 0 && existingItem.effects && existingItem.effects.length > 0)
//         ) {
//           item.effects = foundry.utils.duplicate(existingItem.getEmbeddedCollection("ActiveEffect"));
//         }

//         returnItems.push(item);
//       }
//     } else {
//       returnItems.push(item);
//     }
//   });

//   logger.debug("Finished retaining items");
//   return returnItems;
// }

// // this generates any missing spell data for actors
// // it wont appear in the compendium but will upon import
// async function generateCastSpells(actor) {
//   if (foundry.utils.isNewerVersion(game.system.version, "4.3.3")) return;
//   for (const item of actor.items) {
//     if (!item.system.activities) continue;
//     const spells = (
//       await Promise.all(
//         item.system.activities.getByType("cast").map((a) => a.getCachedSpellData()),
//       )).filter((spell) => !actor.items.find((i) =>
//       i.type === "spell" && foundry.utils.hasProperty(i, "flags.dnd5e.cachedFor")
//       && i.flags?.dnd5e?.cachedFor === spell.flags?.dnd5e?.cachedFor,
//     ));
//     if (spells.length) actor.createEmbeddedDocuments("Item", spells);
//   }
// }

// async function addNPCToCompendium(npc, type = "monster") {
//   const itemImporter = new DDBItemImporter(type, [], {
//     notifier: utils.munchNote,
//   });
//   if (itemImporter.compendium) {
//     const npcBasic = (await itemImporter.addCompendiumFolderIds([foundry.utils.duplicate(npc)]))[0];

//     let compendiumNPC;
//     if (foundry.utils.hasProperty(npc, "_id") && itemImporter.compendium.index.has(npc._id)) {
//       if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing")) {
//         const existingNPC = await itemImporter.compendium.getDocument(npc._id);

//         if (foundry.utils.hasProperty(npcBasic, "prototypeToken.flags.tagger.tags")
//           && foundry.utils.hasProperty(existingNPC, "prototypeToken.flags.tagger.tags")
//         ) {
//           const newTags = [...new Set(npcBasic.prototypeToken.flags.tagger.tags, existingNPC.prototypeToken.flags.tagger.tags)];
//           foundry.utils.setProperty(existingNPC, "prototypeToken.flags.tagger.tags", newTags);
//         }

//         const existing3dModel = foundry.utils.getProperty(existingNPC.prototypeToken, "flags.levels-3d-preview.model3d");
//         if (existing3dModel && existing3dModel.trim() !== "") {
//           foundry.utils.setProperty(npcBasic.prototypeToken, "flags.levels-3d-preview.model3d", existing3dModel);
//         }

//         const monsterTaggedItems = npcBasic.items.map((item) => {
//           foundry.utils.setProperty(item, "flags.ddbimporter.parentId", npc._id);
//           return item;
//         });
//         const existingItems = existingNPC.getEmbeddedCollection("Item");
//         npcBasic.items = await existingItemRetentionCheck(existingItems, monsterTaggedItems, false);
//         logger.debug("NPC Update Data", foundry.utils.duplicate(npcBasic));
//         await existingNPC.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
//         await existingNPC.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
//         console.warn("ExistingNPC", { existingNPC: existingNPC.toObject() });
//         compendiumNPC = await existingNPC.update(npcBasic, { pack: itemImporter.compendium.collection, render: false, keepId: true });
//         // await existingNPC.createEmbeddedDocuments("Item", items, { keepId: true });
//         await generateCastSpells(existingNPC);
//         if (!compendiumNPC) {
//           logger.debug("No changes made to base character", npcBasic);
//           compendiumNPC = existingNPC;
//         }
//       }
//     } else {
//       // create the new npc
//       logger.debug(`Creating NPC actor ${npcBasic.name}`);
//       const options = {
//         displaySheet: false,
//         pack: itemImporter.compendium.collection,
//         keepId: true,
//       };
//       logger.debug("NPC New Data", foundry.utils.duplicate(npcBasic));
//       compendiumNPC = await Actor.create(npcBasic, options);
//       await generateCastSpells(compendiumNPC);
//     }

//   } else {
//     logger.error("Error opening compendium, check your settings");
//   }
//   return npc;
// }

// // export async function addNPCDDBId(npc, type = "monster") {
// //   let npcBasic = foundry.utils.duplicate(npc);
// //   const compendium = CompendiumHelper.getCompendiumType(type, false);
// //   if (compendium) {
// //     // unlock the compendium for update/create
// //     compendium.configure({ locked: false });
// //     const monsterIndexFields = ["name", "flags.ddbimporter.id"];

// //     const index = await compendium.getIndex({ fields: monsterIndexFields });
// //     const npcMatch = index.contents.find((entity) =>
// //       !foundry.utils.hasProperty(entity, "flags.ddbimporter.id")
// //       && entity.name.toLowerCase() === npcBasic.name.toLowerCase()
// //     );

// //     if (npcMatch) {
// //       if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing")) {
// //         const existingNPC = await compendium.getDocument(npcMatch._id);
// //         const updateDDBData = {
// //           _id: npcMatch._id,
// //           "flags.ddbimporter.id": npcBasic.flags.ddbimporter.id,
// //         };
// //         logger.debug("NPCId Update Data", foundry.utils.duplicate(updateDDBData));
// //         await existingNPC.update(updateDDBData);
// //       }
// //     }
// //   } else {
// //     logger.error("Error opening compendium, check your settings");
// //   }
// // }


// // eslint-disable-next-line complexity, no-unused-vars
// export async function getNPCImage(npcData, {
//   type = "monster", forceUpdate = false, forceUseFullToken = false,
//   forceUseTokenAvatar = false, disableAutoTokenizeOverride = false,
// } = {},
// ) {
//   logger.verbose("getNPCImage", {
//     name: npcData.name,
//   });
//   // check to see if we have munched flags to work on
//   if (!foundry.utils.hasProperty(npcData, "flags.monsterMunch.img")) {
//     return npcData;
//   }

//   const updateImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-images");
//   if (!forceUpdate && !updateImages && npcData.img !== CONST.DEFAULT_TOKEN) {
//     return npcData;
//   }

//   const isStock = npcData.flags.monsterMunch.isStockImg;
//   const useAvatarAsToken = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-full-token-image") || forceUseFullToken;
//   const useTokenAsAvatar = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-token-avatar-image") || forceUseTokenAvatar;

//   let ddbAvatarUrl = useTokenAsAvatar
//     ? foundry.utils.getProperty(npcData, "flags.monsterMunch.tokenImg")
//     : foundry.utils.getProperty(npcData, "flags.monsterMunch.img");
//   let ddbTokenUrl = useAvatarAsToken
//     ? foundry.utils.getProperty(npcData, "flags.monsterMunch.img")
//     : foundry.utils.getProperty(npcData, "flags.monsterMunch.tokenImg");

//   if (!ddbAvatarUrl && ddbTokenUrl) ddbAvatarUrl = ddbTokenUrl;
//   if (!ddbTokenUrl && ddbAvatarUrl) ddbTokenUrl = ddbAvatarUrl;

//   const hasAvatarProcessedAlready = CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.get(ddbAvatarUrl);
//   const hasTokenProcessedAlready = CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.get(ddbTokenUrl);

//   const npcType = type.startsWith("vehicle")
//     ? "vehicle"
//     : npcData.system.details.type.value
//       ?? (npcData.system.details.type.custom && npcData.system.details.type.custom !== ""
//         ? npcData.system.details.type.custom
//         : "unknown");
//   const genericNPCName = utils.referenceNameString(npcType);
//   const npcName = utils.referenceNameString(npcData.name);

//   const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
//   const subType = foundry.utils.getProperty(npcData, "system.details.type.value") ?? "other";
//   const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");

//   const rules = npcData.system.source?.rules ?? "2024";
//   const book = utils.normalizeString(npcData.system.source?.book ?? "");
//   const bookRuleStub = [rules, book].join("-");

//   if (ddbAvatarUrl && foundry.utils.getProperty(npcData, "flags.monsterMunch.imgSet") !== true) {
//     if (hasAvatarProcessedAlready) {
//       npcData.img = CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.get(ddbAvatarUrl);
//     } else {
//       const ext = ddbAvatarUrl.split(".").pop().split(/#|\?|&/)[0];
//       const genericNpc = ddbAvatarUrl.endsWith(npcType + "." + ext) || isStock;
//       const name = genericNpc ? genericNPCName : npcName;
//       const nameType = genericNpc ? "npc-generic" : "npc";
//       const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-${nameType}`;
//       // const imageNamePrefix = useDeepPaths ? "" : nameType;
//       const pathPostfix = useDeepPaths ? `/monster/avatar/${subType}` : "";
//       const downloadOptions = { type: nameType, name, targetDirectory, pathPostfix, imageNamePrefix, force: forceUpdate || updateImages };
//       // eslint-disable-next-line require-atomic-updates
//       npcData.img = await FileHelper.getImagePath(ddbAvatarUrl, downloadOptions);
//     }
//   }


//   if (ddbTokenUrl && foundry.utils.getProperty(npcData, "flags.monsterMunch.tokenImgSet") !== true) {
//     if (hasTokenProcessedAlready) {
//       npcData.prototypeToken.texture.src = CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.get(ddbTokenUrl);
//     } else {
//       const tokenExt = ddbTokenUrl.split(".").pop().split(/#|\?|&/)[0];
//       const genericNpc = ddbTokenUrl.endsWith(npcType + "." + tokenExt) || isStock;
//       const name = genericNpc ? genericNPCName : npcName;
//       const nameType = genericNpc ? "npc-generic-token" : "npc-token";
//       const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-${nameType}`;
//       // const imageNamePrefix = useDeepPaths ? "" : nameType;
//       const pathPostfix = useDeepPaths ? `/monster/token/${subType}` : "";
//       // Token images always have to be downloaded.
//       const downloadOptions = {
//         type: nameType,
//         name, download: true,
//         remoteImages: false,
//         force: forceUpdate || updateImages,
//         imageNamePrefix,
//         pathPostfix,
//         targetDirectory,
//       };
//       // eslint-disable-next-line require-atomic-updates
//       npcData.prototypeToken.texture.src = await FileHelper.getImagePath(ddbTokenUrl, downloadOptions);
//     }
//   }

//   // check avatar, if not use token image
//   // eslint-disable-next-line require-atomic-updates
//   if (!npcData.img && npcData.prototypeToken.texture.src) npcData.img = npcData.prototypeToken.texture.src;

//   // final check if image comes back as null
//   // eslint-disable-next-line require-atomic-updates
//   if (npcData.img === null) npcData.img = CONST.DEFAULT_TOKEN;
//   // eslint-disable-next-line require-atomic-updates
//   if (npcData.prototypeToken.texture.src === null) npcData.prototypeToken.texture.src = CONST.DEFAULT_TOKEN;

//   // do we now want to tokenize that?
//   const useTokenizer = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-tokenize")
//     && !disableAutoTokenizeOverride
//     && game.modules.get("vtta-tokenizer")?.active;
//   // we don't tokenize if this path was already looked up, as it will already be done
//   if (useTokenizer && !hasTokenProcessedAlready) {
//     const compendiumLabel = CompendiumHelper.getCompendiumLabel(type);
//     const tokenizerName = isStock
//       ? npcType
//       : npcData.name;
//     const autoOptions = { name: tokenizerName, nameSuffix: `-${bookRuleStub}${compendiumLabel}`, updateActor: false };
//     // eslint-disable-next-line require-atomic-updates
//     npcData.prototypeToken.texture.src = await window.Tokenizer.autoToken(npcData, autoOptions);
//     logger.debug(`Generated tokenizer image at ${npcData.prototypeToken.texture.src}`);
//   }

//   if (!hasAvatarProcessedAlready) CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.set(ddbAvatarUrl, npcData.img);
//   if (!hasTokenProcessedAlready) CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.set(ddbTokenUrl, npcData.prototypeToken.texture.src);

//   return npcData;
// }

// async function swapItems(data) {
//   // temporarily disabled
//   return;
//   // eslint-disable-next-line no-unreachable
//   const swap = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-items");

//   if (swap) {
//     logger.debug("Replacing items...");
//     // console.info(data.items);
//     const getItemOptions = {
//       monsterMatch: true,
//     };
//     const updatedItems = await DDBItemImporter.getCompendiumItems(data.items, "inventory", getItemOptions);
//     const itemsToRemove = updatedItems.map((item) => {
//       logger.debug(`${item.name} to ${item.flags.ddbimporter.originalItemName}`);
//       return { name: item.flags.ddbimporter.originalItemName, type: item.type };
//     });
//     // eslint-disable-next-line no-unreachable
//     logger.debug("Swapping items", itemsToRemove);
//     // console.warn(itemsToRemove);
//     const lessUpdatedItems = data.items.filter((item) =>
//       !itemsToRemove.some((target) => item.name === target.name && item.type === target.type),
//     );
//     // console.log(lessUpdatedItems);
//     const newItems = lessUpdatedItems.concat(updatedItems);
//     // console.error(newItems);
//     // eslint-disable-next-line require-atomic-updates
//     data.items = newItems;

//   }
// }

// export async function buildNPC(data, type = "monster", {
//   temporary = true, update = false, handleBuild = false,
//   forceImageUpdate = undefined,
// } = {}) {
//   logger.debug("Importing Images");
//   await getNPCImage(data, { type, forceUpdate: forceImageUpdate });
//   logger.debug("Checking Items");
//   await swapItems(data);

//   logger.debug("Importing Icons");
//   // eslint-disable-next-line require-atomic-updates
//   data.items = await Iconizer.updateIcons({
//     documents: data.items,
//     srdIconUpdate: false,
//     monster: true,
//     monsterName: data.name,
//   });
//   data = Iconizer.addActorEffectIcons(data);

//   if (!handleBuild) return data;

//   // create the new npc
//   logger.debug("Creating NPC actor");
//   if (update) {
//     const npc = game.actors.get(data._id);
//     await npc.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
//     await Actor.updateDocuments([data]);
//     return npc;
//   } else {
//     const options = {
//       displaySheet: false,
//     };
//     if (temporary) options.temporary = true;
//     const npc = temporary
//       ? new Actor.implementation(data, options)
//       : await Actor.create(data, options);
//     return npc;
//   }

// }

// async function parseNPC(data, type, buildOptions = {}) {
//   const buildNpc = await buildNPC(data, type, buildOptions);
//   logger.info(`Processing ${type} ${buildNpc.name} for the compendium`);
//   const compendiumNPC = await addNPCToCompendium(buildNpc, type);
//   return compendiumNPC;
// }

// export function addNPC(data, type, buildOptions = {}) {
//   return new Promise((resolve, reject) => {
//     parseNPC(data, type, buildOptions)
//       .then((npc) => {
//         resolve(npc);
//       })
//       .catch((error) => {
//         logger.error(`error parsing NPC type ${type}: ${error} ${data.name}`);
//         logger.error(error.stack);
//         reject(error);
//       });
//   });
// }

// export async function useSRDMonsterImages(monsters) {
//   // eslint-disable-next-line require-atomic-updates
//   if (!game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd-monster-images")) return monsters;
//   const srdImageLibrary = await Iconizer.getSRDImageLibrary();
//   utils.munchNote(`Updating SRD Monster Images`, true);

//   monsters.forEach((monster) => {
//     logger.debug(`Checking ${monster.name} for srd images`);
//     const nameMatch = srdImageLibrary.find((m) => m.name === monster.name && m.type === "npc");
//     if (nameMatch) {
//       logger.debug(`Updating monster ${monster.name} to srd images`, nameMatch);
//       const compendiumName = SETTINGS.SRD_COMPENDIUMS.find((c) => c.type == "monsters").name;
//       const moduleArt = game.dnd5e.moduleArt.map.get(`Compendium.${compendiumName}.${nameMatch._id}`);
//       logger.debug(`Updating monster ${monster.name} to srd images`, { nameMatch, moduleArt });
//       monster.prototypeToken.texture.scaleY = nameMatch.prototypeToken.texture.scaleY;
//       monster.prototypeToken.texture.scaleX = nameMatch.prototypeToken.texture.scaleX;
//       if (moduleArt?.actor && nameMatch.actor !== "" && !moduleArt.actor.includes("mystery-man")) {
//         monster.img = moduleArt.actor;
//         foundry.utils.setProperty(monster, "flags.monsterMunch.imgSet", true);
//       } else if (nameMatch.img && nameMatch.img !== "" && !nameMatch.img.includes("mystery-man")) {
//         monster.img = nameMatch.img;
//         foundry.utils.setProperty(monster, "flags.monsterMunch.imgSet", true);
//       }
//       if (moduleArt?.token && !foundry.utils.hasProperty(moduleArt, "token.texture.src")) {
//         monster.prototypeToken.texture.src = moduleArt.token;
//       } else if (moduleArt?.token?.texture?.src
//         && moduleArt.token.texture.src !== ""
//         && !moduleArt.token.texture.src.includes("mystery-man")
//       ) {
//         monster.prototypeToken.texture.src = moduleArt.token.texture.src;
//         foundry.utils.setProperty(monster, "flags.monsterMunch.tokenImgSet", true);
//         if (moduleArt.token.texture.scaleY) monster.prototypeToken.texture.scaleY = moduleArt.token.texture.scaleY;
//         if (moduleArt.token.texture.scaleX) monster.prototypeToken.texture.scaleX = moduleArt.token.texture.scaleX;
//         if (moduleArt.token.ring) monster.prototypeToken.ring = moduleArt.token.ring;
//       } else if (nameMatch.prototypeToken?.texture?.src
//         && nameMatch.prototypeToken.texture.src !== ""
//         && !nameMatch.prototypeToken.texture.src.includes("mystery-man")
//       ) {
//         foundry.utils.setProperty(monster, "flags.monsterMunch.tokenImgSet", true);
//         monster.prototypeToken.texture.src = nameMatch.prototypeToken.texture.src;
//       }
//     }
//   });

//   return monsters;
// }

// export async function generateIconMap(monsters) {
//   let promises = [];

//   const srdIcons = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd-icons");
//   // eslint-disable-next-line require-atomic-updates
//   if (srdIcons) {
//     const srdImageLibrary = await Iconizer.getSRDImageLibrary();
//     utils.munchNote(`Updating SRD Icons`, true);
//     let itemMap = [];

//     monsters.forEach((monster) => {
//       utils.munchNote(`Processing ${monster.name}`);
//       promises.push(
//         Iconizer.copySRDIcons(monster.items, srdImageLibrary, itemMap).then((items) => {
//           monster.items = items;
//         }),
//       );
//     });
//   }

//   return Promise.all(promises);
// }

// export function copyExistingMonsterImages(monsters, existingMonsters) {
//   const updated = monsters.map((monster) => {
//     const existing = existingMonsters.find((m) =>
//       monster.name === m.name
//       && monster.system.source.rules === m.system.source.rules,
//     );
//     if (existing) {
//       monster.img = existing.img;
//       for (const key of Object.keys(monster.prototypeToken)) {
//         if (!["name", "sight", "detectionModes", "flags", "light", "ring", "occludable"].includes(key) && foundry.utils.hasProperty(existing.prototypeToken, key)) {
//           monster.prototypeToken[key] = foundry.utils.deepClone(existing.prototypeToken[key]);
//         }
//       }
//       return monster;
//     } else {
//       return monster;
//     }
//   });
//   return updated;
// }
