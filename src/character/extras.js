import logger from "../logger.js";
import utils from "../utils.js";
import { parseMonsters } from "../muncher/monster/monster.js";
import { copySupportedItemFlags, srdFiddling } from "../muncher/import.js";
import { buildNPC, generateIconMap, copyExistingMonsterImages } from "../muncher/importMonster.js";
import { DDB_CONFIG } from "../ddb-config.js";
import { ABILITIES } from "../muncher/monster/abilities.js";

const MUNCH_DEFAULTS = [
  { name: "munching-policy-update-existing", needed: true, },
  { name: "munching-policy-use-srd", needed: false, },
  { name: "munching-policy-use-inbuilt-icons", needed: true, },
  { name: "munching-policy-use-srd-icons", needed: false, },
  { name: "munching-policy-use-iconizer", needed: false, },
  { name: "munching-policy-download-images", needed: true, },
  { name: "munching-policy-remote-images", needed: false, },
  { name: "munching-policy-use-dae-effects", needed: false, },
  { name: "munching-policy-hide-description", needed: false, },
  { name: "munching-policy-monster-items", needed: false, },
  { name: "munching-policy-update-images", needed: false, },
  { name: "munching-policy-dae-copy", needed: false, },
];

function getCustomValue(ddb, typeId, valueId, valueTypeId) {
  const characterValues = ddb.characterValues;
  const customValue = characterValues.find((value) =>
    value.valueId == valueId &&
    value.valueTypeId == valueTypeId &&
    value.typeId == typeId
  );

  if (customValue) {
    return customValue.value;
  }
  return null;
}

async function updateExtras(extras, existingExtras) {
  return Promise.all(
    extras
      .filter((extra) => existingExtras.some((exist) =>
        exist.flags?.ddbimporter?.id === extra.flags.ddbimporter.id &&
        extra.flags?.ddbimporter?.entityTypeId === extra.flags.ddbimporter.entityTypeId
      ))
      .map(async (extra) => {
        const existingExtra = await existingExtras.find((existing) => extra.name === existing.name);
        extra._id = existingExtra._id;
        logger.info(`Updating extra ${extra.name}`);
        await copySupportedItemFlags(existingExtra, extra);
        // await Actor.update(extra);
        await buildNPC(extra, false, true);
        return extra;
      })
  );
};

async function createExtras(extras, existingExtras, folderId) {
  return Promise.all(
    extras
      .filter((extra) => !existingExtras.some((exist) =>
        exist.flags?.ddbimporter?.id === extra.flags.ddbimporter.id &&
        extra.flags?.ddbimporter?.entityTypeId === extra.flags.ddbimporter.entityTypeId
      ))
      .map(async (extra) => {
        if (!game.user.can("ITEM_CREATE")) {
          ui.notifications.warn(`Cannot create Extra ${extra.name} for ${type}`);
        } else {
          logger.info(`Creating Extra ${extra.name}`);
          extra.folder = folderId;
          await buildNPC(extra, false);
        }
        return extra;
      })
  );
};

export async function characterExtras(html, characterData, actor) {

  console.warn(characterData);
  console.warn(actor);

  let munchSettings = [];

  MUNCH_DEFAULTS.forEach((setting) => {
    console.warn(setting.name);
    setting["chosen"] = game.settings.get("ddb-importer", setting.name);
    munchSettings.push(setting);
  });

  munchSettings.forEach((setting) => {
    game.settings.set("ddb-importer", setting.name, setting.needed);
  });

  try {
    console.warn(characterData.ddb);
    console.warn(actor);
    if (characterData.ddb.creatures.length === 0) return;

    const folder = await utils.getOrCreateFolder(actor.folder, "Actor", `[Extras] ${actor.name}`);

    let creatures = characterData.ddb.creatures.map((creature) => {
      console.log(creature);
      let mock = creature.definition;

      if (creature.name) mock.name = creature.name;

      // size
      const sizeChange = getCustomValue(characterData.ddb, 46, creature.id, creature.entityTypeId);
      if (sizeChange) mock.sizeId = sizeChange;

      // hp
      const hpMaxChange = getCustomValue(characterData.ddb, 43, creature.id, creature.entityTypeId);
      if (hpMaxChange) mock.averageHitPoints = hpMaxChange;

      // creature type
      const typeChange = getCustomValue(characterData.ddb, 44, creature.id, creature.entityTypeId);
      if (typeChange) mock.typeId = typeChange;

      // ac
      const acChange = getCustomValue(characterData.ddb, 42, creature.id, creature.entityTypeId);
      if (acChange) mock.armorClass = acChange;

      // alignment
      const alignmentChange = getCustomValue(characterData.ddb, 45, creature.id, creature.entityTypeId);
      if (alignmentChange) mock.alignmentId = alignmentChange;

      // notes
      const extraNotes = getCustomValue(characterData.ddb, 47, creature.id, creature.entityTypeId);
      if (extraNotes) mock.characteristicsDescription += `\n\n${extraNotes}`;

      // TODO
      // proficiency based changes for things like steel defender

      const creatureGroup = DDB_CONFIG.creatureGroups.find((group) => group.id == creature.groupId);
      const creatureFlags = creatureGroup.flags;

      if (creatureFlags.includes("ARPB") && creatureFlags.includes("PSPB")) {
        mock.challengeRatingId = actor.data.flags.ddbimporter.dndbeyond.totalLevels + 4;
      }

      console.log(creatureGroup.ownerStats);
      const creatureStats = mock.stats.filter((stat) => !creatureGroup.ownerStats.includes(stat.statId));
      const characterStats = mock.stats.filter((stat) => creatureGroup.ownerStats.includes(stat.statId))
        .map((stat) => {
          const value = actor.data.data.abilities[ABILITIES.find((a) => a.id === stat.statId).value].value
          return { name: null, statId: stat.statId, value: value}
        });

      mock.stats = creatureStats.concat(characterStats);

      // permissions the same as
      mock.permission = actor.data.permission;
      mock.folder = folder._id;

      if (creatureGroup.description !== "") {
        mock.characteristicsDescription = `${creatureGroup.description }\n\n${mock.characteristicsDescription}`;
      }

      if (creatureGroup.specialQualityTitle) {
        mock.specialTraitsDescription = `${mock.specialTraitsDescription} <p><em><strong>${creatureGroup.specialQualityTitle}.</strong></em> ${creatureGroup.specialQualityText}</p>`;
      }

      if (creatureFlags.includes("ACPB")) {
        mock.armorClass += actor.data.data.attributes.prof;
      }

      // assume this is beast master
      if (creatureFlags.includes("HPLM")) {
        const ranger = characterData.ddb.classes.find((klass) => klass.definition.id === 5)
        mock.averageHitPoints = Math.max(mock.averageHitPoints, 4 * ranger.levels);
      }


      // todo:
      // { id: 7, name: "Evaluate Owner Skill Proficiencies", key: "EOSKP", value: null, valueContextId: null },
      // { id: 8, name: "Evaluate Owner Save Proficiencies", key: "EOSVP", value: null, valueContextId: null },
      // { id: 10, name: "Cannot Use Legendary Actions", key: "CULGA", value: null, valueContextId: null },
      // { id: 11, name: "Cannot Use Lair Actions", key: "CULRA", value: null, valueContextId: null },
      // { id: 12, name: "Evaluate_Updated_Passive_Perception", key: "EUPP", value: null, valueContextId: null },
      // { id: 13, name: "Evaluate Owner Passive Perception", key: "EOPP", value: null, valueContextId: null },
      // { id: 14, name: "Artificer HP Multiplier", key: "AHM", value: 5, valueContextId: 252717 },
      // { id: 15, name: "Max Hit Points Add Int Modifier", key: "MHPAIM", value: null, valueContextId: 4 },
      // { id: 16, name: "Max Hit Points Add Monster CON Modifier", key: "MHPAMCM", value: null, valueContextId: 3 },
      // { id: 17, name: "Use Challenge Rating As Level", key: "UCRAL", value: null, valueContextId: null },
      // { id: 18, name: "Max Hit Points Base Artificer Level", key: "MHPBAL", value: null, valueContextId: 252717 },

      console.log(mock);
      return mock;
    });
    let parsedExtras = await parseMonsters(creatures);
    parsedExtras = parsedExtras.actors;
    console.warn(parsedExtras);
    // TODO: deal with hp adjustments here

    // if (creatureFlags.includes("DRPB")) {
    //   if (creatureGroup.id === 3){
    //   // beast companions add @prof
    //   } else if (creatureGroup.id === 10) {
      // artificer battle thing replaces
    //     mock.actionsDescription = mock.actionsDescription.replace(/ \+ 2 /g, ` + ${actor.data.data.attributes.prof} `);
    //   } else if (creatureGroup.id === 12) {
    //     // infusions
    //     mock.actionsDescription = mock.actionsDescription.replace(/ \+ 2 /g, ` + ${actor.data.data.attributes.prof} `);
    //   }
    // }

    //DDB_CONFIG.creatureGroupFlags.find((cr) => cr.id == monster.challengeRatingId);
    // DDB_CONFIG.creatureGroups.find((group) => group.id == monster.groupId);

    const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
    const updateImages = game.settings.get("ddb-importer", "munching-policy-update-images");
    // const uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");

    const existingExtras = await game.actors.entities
      .filter((extra) => extra.data.folder === folder._id)
      .map((extra) => extra.data);

    if (!updateBool || !updateImages) {
      if (!updateImages) {
        logger.debug("Copying monster images across...");
        parsedExtras = copyExistingMonsterImages(parsedExtras, existingExtras);
      }
    }

    let finalExtras = await srdFiddling(parsedExtras, "monsters");
    await generateIconMap(finalExtras);

    if (updateBool) await updateExtras(finalExtras, existingExtras);
    await createExtras(finalExtras, existingExtras, folder._id);

  } catch (err) {
    logger.error("Failure parsing extra", err);
    logger.error(err.stack);
  } finally {
    munchSettings.forEach((setting) => {
      console.warn(`Returning ${setting.name} to ${setting.chosen}`);
      game.settings.set("ddb-importer", setting.name, setting.chosen);
    });
  }

}
