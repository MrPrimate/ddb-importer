/* eslint-disable no-await-in-loop */
import DICTIONARY from "../dictionary.js";
import FolderHelper from "../lib/FolderHelper.js";
import utils from "../lib/utils.js";
import logger from "../logger.js";
import { addExtraEffects, fixFeatures } from "../parser/features/special.js";
import { fixItems } from "../parser/item/special.js";
import { fixSpells } from "../parser/spells/special.js";
import { applyChrisPremadeEffects } from "./chrisPremades.js";
import { equipmentEffectAdjustment, midiItemEffects } from "./specialEquipment.js";
import { spellEffectAdjustment } from "./specialSpells.js";
import { addVision5eStub } from "./vision5e.js";

/**
 * If the requirements are met, returns true, false otherwise.
 *
 * @returns true if the requirements are met, false otherwise.
 */
export function requirementsSatisfied(name, dependencies) {
  let missingDep = false;
  dependencies.forEach((dep) => {
    if (!game.modules.get(dep)?.active) {
      const errorMsg = `${name}: ${dep} must be installed and active.`;
      ui.notifications.error(errorMsg);
      logger.warn(errorMsg);
      missingDep = true;
    }
  });
  return !missingDep;
}


export async function addDDBIEffectToDocument(document, { useChrisPremades = false } = {}) {
  if (getProperty(document, "flags.ddbimporter.effectsApplied") === true
    || getProperty(document, "flags.ddbimporter.chrisEffectsApplied") === true
  ) {
    logger.warn(`Skipping effect generation for ${document.name} as DDB Importer or Chris effect is already present.`);
    return;
  }
  const startingSpellPolicy = game.settings.get("ddb-importer", "munching-policy-add-spell-effects");
  const startingAddPolicy = game.settings.get("ddb-importer", "munching-policy-add-effects");
  try {
    game.settings.set("ddb-importer", "munching-policy-add-spell-effects", true);
    game.settings.set("ddb-importer", "munching-policy-add-effects", true);

    let data = document.toObject();
    // remove old effects
    data.effects = [];
    if (hasProperty(data, "flags.dae")) delete data.flags.dae;
    if (hasProperty(data, "flags.itemacro")) delete data.flags.itemacro;
    if (hasProperty(data, "flags.midi-qol")) delete data.flags["midi-qol"];
    if (hasProperty(data, "flags.ActiveAuras")) delete data.flags.ActiveAuras;

    if (DICTIONARY.types.inventory.includes(data.type)) {
      equipmentEffectAdjustment(data);
      data = await midiItemEffects(data);
      fixItems([data]);
    } else if (data.type === "spell") {
      data = await spellEffectAdjustment(data);
      fixSpells(null, [data]);
    } else if (data.type === "feat") {
      const mockCharacter = {
        system: JSON.parse(utils.getTemplate("character")),
        type: "character",
        name: "",
        flags: {
          ddbimporter: {
            compendium: true,
            dndbeyond: {
              effectAbilities: [],
              totalLevels: 0,
              proficiencies: [],
              proficienciesIncludingEffects: [],
              characterValues: [],
            },
          },
        },
      };

      await fixFeatures([data]);
      data = (await addExtraEffects(null, [data], mockCharacter))[0];
    }

    if (useChrisPremades) data = (await applyChrisPremadeEffects({ documents: [data], force: true }))[0];

    data = addVision5eStub(data);

    if (getProperty(data, "flags.ddbimporter.effectsApplied") === true
      || getProperty(data, "flags.ddbimporter.chrisEffectsApplied") === true
    ) {
      logger.debug("New effects generated, removing existing effects");
      if (isNewerVersion(game.version, 11)) {
        await document.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
      } else {
        await document.update({
          effects: [],
        }, { ...document, recursive: false });
      }
      logger.debug(`Removal complete, adding effects to item ${document.name}`);

      logger.info(`Updating actor document ${document.name} with`, {
        data: duplicate(data),
      });
      await document.update(data);
    } else {
      logger.info(`No effects applied to document ${document.name}`);
    }
  } finally {
    game.settings.set("ddb-importer", "munching-policy-add-spell-effects", startingSpellPolicy);
    game.settings.set("ddb-importer", "munching-policy-add-effects", startingAddPolicy);
  }
}

export async function addDDBIEffectsToActorDocuments(actor, { useChrisPremades = false } = {}) {
  logger.info("Starting to add effects to actor items");
  for (const doc of actor.items) {
    logger.debug(`Processing ${doc.name}`);
    await addDDBIEffectToDocument(doc, { useChrisPremades });
  }
  logger.info("Effect addition complete");
}

/**
 * If a custom AA condition animation exists for the specified name, registers the appropriate hook with AA
 * to be able to replace the default condition animation by the custom one.
 *
 * @param {*} condition condition for which to replace its AA animation by a custom one (it must be a value from CONFIG.DND5E.conditionTypes).
 * @param {*} macroData the midi-qol macro data.
 * @param {*} originItemName the name of item used for AA customization of the condition.
 * @param {*} conditionItemUuid the UUID of the item applying the condition.
 */
export function configureCustomAAForCondition(condition, macroData, originItemName, conditionItemUuid) {
  // Get default condition label
  const statusName = CONFIG.DND5E.conditionTypes[condition];
  const customStatusName = `${statusName} [${originItemName}]`;
  if (AutomatedAnimations.AutorecManager.getAutorecEntries().aefx.find((a) => (a.name ?? a.label) === customStatusName)) {
    const aaHookId = Hooks.on("AutomatedAnimations-WorkflowStart", (data) => {
      if (
        data.item instanceof CONFIG.ActiveEffect.documentClass
        && (data.item.name ?? data.item.label) === statusName
        && data.item.origin === macroData.sourceItemUuid
      ) {
        data.recheckAnimation = true;
        if (isNewerVersion(game.version, 11)) {
          data.item.name = customStatusName;
        } else {
          data.item.label = customStatusName;
        }
        Hooks.off("AutomatedAnimations-WorkflowStart", aaHookId);
      }
    });
    // Make sure that the hook is removed when the special spell effect is completed
    Hooks.once(`midi-qol.RollComplete.${conditionItemUuid}`, () => {
      Hooks.off("AutomatedAnimations-WorkflowStart", aaHookId);
    });
  }
}

export function checkJB2a(free = true, patreon = true, notify = false) {
  if (patreon && game.modules.get('jb2a_patreon')?.active) {
    return true;
  } else if (!free) {
    if (notify) ui.notifications.error("This macro requires the patreon version of JB2A");
    return false;
  }
  if (free && game.modules.get('JB2A_DnD5e')?.active) return true;
  if (notify) ui.notifications.error("This macro requires either the patreon or free version of JB2A");
  return false;
}

/**
 * Adds a save advantage effect for the next save on the specified target actor.
 *
 * @param {*} targetActor the target actor on which to add the effect.
 * @param {*} originItem the item that is the origin of the effect.
 * @param {*} ability the short ability name to use for save, e.g. str
 */
export async function addSaveAdvantageToTarget(targetActor, originItem, ability, additionLabel = "", icon = null) {
  const effectData = {
    _id: randomID(),
    changes: [
      {
        key: `flags.midi-qol.advantage.ability.save.${ability}`,
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    origin: originItem.uuid,
    disabled: false,
    transfer: false,
    icon,
    duration: { turns: 1 },
    flags: {
      dae: {
        specialDuration: [`isSave.${ability}`],
      },
    },
  };
  if (isNewerVersion(game.version, 11)) {
    effectData.name = `${originItem.name}${additionLabel}: Save Advantage`;
  } else {
    effectData.label = `${originItem.name}${additionLabel}: Save Advantage`;
  }
  await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [effectData] });
}

/**
 * Returns ids of tokens in template
 *
 * @param {*} templateDoc the templatedoc to check
 */
export function findContainedTokensInTemplate(templateDoc) {
  const contained = new Set();
  for (const tokenDoc of templateDoc.parent.tokens) {
    const startX = tokenDoc.width >= 1 ? 0.5 : tokenDoc.width / 2;
    const startY = tokenDoc.height >= 1 ? 0.5 : tokenDoc.height / 2;
    for (let x = startX; x < tokenDoc.width; x++) {
      for (let y = startY; y < tokenDoc.width; y++) {
        const curr = {
          x: tokenDoc.x + (x * templateDoc.parent.grid.size) - templateDoc.x,
          y: tokenDoc.y + (y * templateDoc.parent.grid.size) - templateDoc.y,
        };
        const contains = templateDoc.object.shape.contains(curr.x, curr.y);
        if (contains) contained.add(tokenDoc.id);
      }
    }
  }
  return [...contained];
}

export function checkCollision(ray, types = ["sight", "move"], mode = "any") {
  for (const type of types) {
    const result = isNewerVersion(11, game.version)
      ? canvas.walls.checkCollision(ray, { mode, type })
      : CONFIG.Canvas.polygonBackends[type].testCollision(ray.A, ray.B, { mode, type });
    if (result) return result;
  }
  return false;
}

export async function checkTargetInRange({ sourceUuid, targetUuid, distance }) {
  if (!game.modules.get("midi-qol")?.active) {
    ui.notifications.error("checkTargetInRange requires midiQoL, not checking");
    logger.error("checkTargetInRange requires midiQoL, not checking");
    return true;
  }
  const sourceToken = await fromUuid(sourceUuid);
  if (!sourceToken) return false;
  const targetsInRange = MidiQOL.findNearby(null, sourceUuid, distance);
  const isInRange = targetsInRange.reduce((result, possible) => {
    const collisionRay = new Ray(sourceToken, possible);
    const collision = checkCollision(collisionRay, ["sight"]);
    if (possible.uuid === targetUuid && !collision) result = true;
    return result;
  }, false);
  return isInRange;
}


/**
 * Returns true if the attack is a ranged weapon attack that hit. It also supports melee weapons
 * with the thrown property.
 * @param {*} macroData the midi-qol macro data.
 * @returns true if the attack is a ranged weapon attack that hit
 */
export function isRangedWeaponAttack(macroData) {
  if (macroData.hitTargets.length < 1) {
    return false;
  }
  if (macroData.item?.system.actionType === "rwak") {
    return true;
  }
  if (macroData.item?.system.actionType !== "mwak" || !macroData.item?.system.properties?.thr) {
    return false;
  }

  const sourceToken = canvas.tokens?.get(macroData.tokenId);
  const targetToken = macroData.hitTargets[0].object;
  const distance = MidiQOL.getDistance(sourceToken, targetToken, true, true);
  const meleeDistance = 5; // Would it be possible to have creatures with reach and thrown weapon?
  return distance >= 0 && distance > meleeDistance;
}

/**
 * Selects all the tokens that are within X distance of the source token for the current game user.
 * @param {Token} sourceToken the reference token from which to compute the distance.
 * @param {number} distance the distance from the reference token.
 * @param {boolean} includeSource flag to indicate if the reference token should be included or not in the selected targets.
 * @returns an array of Token instances that were selected.
 */
export function selectTargetsWithinX(sourceToken, distance, includeSource) {
  let aoeTargets = MidiQOL.findNearby(null, sourceToken, distance);
  if (includeSource) {
    aoeTargets.unshift(sourceToken);
  }
  const aoeTargetIds = aoeTargets.map((t) => t.document.id);
  game.user?.updateTokenTargets(aoeTargetIds);
  game.user?.broadcastActivity({ aoeTargetIds });
  return aoeTargets;
}


export async function attachSequencerFileToTemplate(templateUuid, sequencerFile, originUuid, scale = 1) {
  if (game.modules.get("sequencer")?.active) {
    if (Sequencer.Database.entryExists(sequencerFile)) {
      logger.debug(`Trying to apply sequencer effect (${sequencerFile}) to ${templateUuid} from ${originUuid}`, sequencerFile);
      const template = await fromUuid(templateUuid);
      new Sequence()
        .effect()
        .file(Sequencer.Database.entryExists(sequencerFile))
        .size({
          width: canvas.grid.size * (template.width / canvas.dimensions.distance),
          height: canvas.grid.size * (template.width / canvas.dimensions.distance),
        })
        .persist(true)
        .origin(originUuid)
        .belowTokens()
        .opacity(0.5)
        .attachTo(template, { followRotation: true })
        .scaleToObject(scale)
        .play();
    }
  }
}

/**
 * Returns a new duration which reflects the remaining duration of the specified one.
 *
 * @param {*} duration the source duration
 * @returns a new duration which reflects the remaining duration of the specified one.
 */
export function getRemainingDuration(duration) {
  const newDuration = {};
  if (duration.type === "seconds") {
    newDuration.seconds = duration.remaining;
  } else if (duration.type === "turns") {
    const remainingRounds = Math.floor(duration.remaining);
    const remainingTurns = (duration.remaining - remainingRounds) * 100;
    newDuration.rounds = remainingRounds;
    newDuration.turns = remainingTurns;
  }
  return newDuration;
}


export async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getHighestAbility(actor, abilities) {
  if (typeof abilities === "string") {
    return abilities;
  } else if (Array.isArray(abilities)) {
    return abilities.reduce((prv, current) => {
      if (actor.system.abilities[current].value > actor.system.abilities[prv].value) return current;
      else return prv;
    }, abilities[0]);
  }
  return undefined;
}

export function getCantripDice(actor) {
  const level = actor.type === "character" ? actor.system.details.level : actor.system.details.cr;
  return 1 + Math.floor((level + 1) / 6);
}


export async function createJB2aActors(subFolderName, name) {
  const packKeys = ['jb2a_patreon.jb2a-actors', 'JB2A_DnD5e.jb2a-actors'];
  for (let key of packKeys) {
    let pack = game.packs.get(key);
    // eslint-disable-next-line no-continue
    if (!pack) continue;
    const actors = pack.index.filter((f) => f.name.includes(name));
    const subFolder = await FolderHelper.getFolder("npc", subFolderName, "JB2A Actors", "#ceb180", "#cccc00", false);

    for (const actor of actors) {
      if (!game.actors.find((a) => a.name === actor.name && a.folder?.id === subFolder.id)) {
        await game.actors.importFromCompendium(pack, actor._id, {
          folder: subFolder.id,
        });
      }
    }
  }

}

export function updateUserTargets(targets) {
  game.user.updateTokenTargets(targets);
}

export function findEffect(actor, name) {
  if (isNewerVersion(game.version, 11)) {
    return actor.effects.getName(name);
  } else {
    return actor.effects.find((e) => e.label === name);
  }
}

export function findEffects(actor, names) {
  const results = [];
  for (const name of names) {
    if (findEffect(actor, name)) {
      results.push(findEffect(actor, name));
    }
  }
  return results;
}
