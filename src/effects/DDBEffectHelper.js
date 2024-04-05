/* eslint-disable no-await-in-loop */
import DialogHelper from "../lib/DialogHelper.js";
import DICTIONARY from "../dictionary.js";
import FolderHelper from "../lib/FolderHelper.js";
import utils from "../lib/utils.js";
import logger from "../logger.js";
import { fixItems } from "../parser/item/special.js";
import { fixSpells } from "../parser/spells/special.js";
import { equipmentEffectAdjustment, midiItemEffects } from "./specialEquipment.js";
import { spellEffectAdjustment } from "./specialSpells.js";
import { addVision5eStub } from "./vision5e.js";
import { fixFeatures, addExtraEffects } from "../parser/features/fixes.js";
import { generateOverTimeEffect, damageOverTimeEffect, getOvertimeDamage, getMonsterFeatureDamage } from "./monsterFeatures/overTimeEffect.js";
import { baseEffect, generateStatusEffectChange, generateCEStatusEffectChange, addStatusEffectChange, generateTokenMagicFXChange, generateATLChange } from "./effects.js";
import ExternalAutomations from "./external/ExternalAutomations.js";

export default class DDBEffectHelper {

  static baseEffect = baseEffect;

  static generateOverTimeEffect = generateOverTimeEffect;

  static getOvertimeDamage = getOvertimeDamage;

  static getMonsterFeatureDamage = getMonsterFeatureDamage;

  static damageOverTimeEffect = damageOverTimeEffect;

  static generateStatusEffectChange = generateStatusEffectChange;

  static generateCEStatusEffectChange = generateCEStatusEffectChange;

  static addStatusEffectChange = addStatusEffectChange;

  static generateTokenMagicFXChange = generateTokenMagicFXChange;

  static generateATLChange = generateATLChange;

  static addToProperties = utils.addToProperties;

  static removeFromProperties = utils.removeFromProperties;

  /**
   * Generates and applies DDBI effects to a document.
   *
   * @param {Document} document - The document to apply effects to.
   * @param {object} options - Options for effect generation.
   * @param {boolean} options.useChrisPremades - Whether to use Chris premade effects. Default is false.
   * @return {Promise<void>} A promise that resolves when the effects have been applied.
   */
  static async addDDBIEffectToDocument(document, { useChrisPremades = false, isMonster = false } = {}) {
    if (foundry.utils.getProperty(document, "flags.ddbimporter.effectsApplied") === true
      || foundry.utils.getProperty(document, "flags.ddbimporter.chrisEffectsApplied") === true
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
      if (foundry.utils.hasProperty(data, "flags.dae")) delete data.flags.dae;
      if (foundry.utils.hasProperty(data, "flags.itemacro")) delete data.flags.itemacro;
      if (foundry.utils.hasProperty(data, "flags.midi-qol")) delete data.flags["midi-qol"];
      if (foundry.utils.hasProperty(data, "flags.ActiveAuras")) delete data.flags.ActiveAuras;

      if (DICTIONARY.types.inventory.includes(data.type)) {
        equipmentEffectAdjustment(data);
        data = await midiItemEffects(data);
        fixItems([data]);
      } else if (data.type === "spell") {
        data = await spellEffectAdjustment(data, true);
        fixSpells(null, [data]);
      } else if (data.type === "feat") {
        const mockCharacter = {
          system: utils.getTemplate("character"),
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

      if (useChrisPremades) data = (await ExternalAutomations.applyChrisPremadeEffects({ documents: [data], force: true, isMonster }))[0];

      data = addVision5eStub(data);

      if (foundry.utils.getProperty(data, "flags.ddbimporter.effectsApplied") === true
        || foundry.utils.getProperty(data, "flags.ddbimporter.chrisEffectsApplied") === true
      ) {
        logger.debug("New effects generated, removing existing effects");
        await document.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
        logger.debug(`Removal complete, adding effects to item ${document.name}`);

        logger.info(`Updating actor document ${document.name} with`, {
          data: foundry.utils.duplicate(data),
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

  /**
   * Adds DDBI effects to actor documents.
   *
   * @param {Object} actor - The actor object.
   * @param {Object} options - The options object.
   * @param {boolean} options.useChrisPremades - Whether to use Chris premades.
   * @return {Promise<void>} - A promise that resolves when the effects are added.
   */
  static async addDDBIEffectsToActorDocuments(actor, { useChrisPremades = false } = {}) {
    logger.info("Starting to add effects to actor items");
    const isMonster = actor.type === "npc";
    for (const doc of actor.items) {
      logger.debug(`Processing ${doc.name}`);
      await DDBEffectHelper.addDDBIEffectToDocument(doc, { useChrisPremades, isMonster });
    }
    logger.info("Effect addition complete");
  }

  /**
   * Adds a save advantage effect for the next save on the specified target actor.
   *
   * @param {*} targetActor the target actor on which to add the effect.
   * @param {*} originItem the item that is the origin of the effect.
   * @param {*} ability the short ability name to use for save, e.g. str
   */
  static async addSaveAdvantageToTarget(targetActor, originItem, ability, additionLabel = "", icon = null) {
    const effectData = {
      _id: foundry.utils.randomID(),
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
    effectData.name = `${originItem.name}${additionLabel}: Save Advantage`;
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [effectData] });
  }

  static async attachSequencerFileToTemplate(templateUuid, sequencerFile, originUuid, scale = 1) {
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

  static async buttonDialog(config, direction) {
    return DialogHelper.buttonDialog(config, direction);
  }

  static canSense(token, target) {
    return MidiQOL.canSense(token, target);
  }

  static checkCollision(ray, types = ["sight", "move"], mode = "any") {
    for (const type of types) {
      const result = CONFIG.Canvas.polygonBackends[type].testCollision(ray.A, ray.B, { mode, type });
      if (result) return result;
    }
    return false;
  }

  /**
   * Checks the cover bonus for a given token, target, item, and displayName.
   *
   * @param {any} token - The token object.
   * @param {any} target - The target object.
   * @param {any} item - The item object.
   * @param {string} displayName - The display name of the cover.
   * @return {string|number} The cover bonus or the display name of the cover.
   */
  static checkCover(token, target, item, displayName) {
    const cover = MidiQOL.computeCoverBonus(token, target, item);
    if (!displayName) return cover;
    switch (cover) {
      case 0:
        return "No Cover";
      case 2:
        return "Half Cover";
      case 5:
        return "Three-Quarters Cover";
      case 999:
        return "Full Cover";
      default:
        return "Unknown Cover";
    }
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
  static configureCustomAAForCondition(condition, macroData, originItemName, conditionItemUuid) {
    // Get default condition label
    const statusName = CONFIG.DND5E.conditionTypes[condition];
    if (!statusName) {
      return;
    }
    const customStatusName = `${statusName.label} [${originItemName}]`;
    if (AutomatedAnimations.AutorecManager.getAutorecEntries().aefx.find((a) => (a.label ?? a.name) === customStatusName)) {
      const aaHookId = Hooks.on("AutomatedAnimations-WorkflowStart", (data) => {
        if (
          data.item instanceof CONFIG.ActiveEffect.documentClass
          && data.item.name === statusName.label
          && data.item.origin === macroData.sourceItemUuid
        ) {
          data.recheckAnimation = true;
          data.item.name = customStatusName;
          Hooks.off("AutomatedAnimations-WorkflowStart", aaHookId);
        }
      });
      // Make sure that the hook is removed when the special spell effect is completed
      Hooks.once(`midi-qol.RollComplete.${conditionItemUuid}`, () => {
        Hooks.off("AutomatedAnimations-WorkflowStart", aaHookId);
      });
    }
  }

  static checkJB2a(free = true, patreon = true, notify = false) {
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

  static async _createJB2aActors(subFolderName, name) {
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

  static async checkTargetInRange({ sourceUuid, targetUuid, distance }) {
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
      const collision = DDBEffectHelper.checkCollision(collisionRay, ["sight"]);
      if (possible.uuid === targetUuid && !collision) result = true;
      return result;
    }, false);
    return isInRange;
  }

  /**
   * Display an item card on the screen.
   *
   * @param {Object} item - The item to display the card for
   * @return {Promise} A promise that resolves when the card is displayed
   */
  static async displayItemCard(item) {
    const msg = await item.displayCard({ createMessage: false });
    const DIV = document.createElement("DIV");
    DIV.innerHTML = msg.content;
    DIV.querySelector("div.card-buttons").remove();
    await ChatMessage.create({ content: DIV.innerHTML });
  }

  /**
   * Returns ids of tokens in template
   *
   * @param {*} templateDoc the templatedoc to check
   */
  static findContainedTokensInTemplate(templateDoc) {
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

  /**
   * Finds the effect with the specified name for the given actor.
   *
   * @param {Actor} actor - The actor to search for the effect.
   * @param {string} name - The name of the effect to find.
   * @return {Effect} - The effect with the specified name, or undefined if not found.
   */
  static findEffect(actor, name) {
    return actor.effects.getName(name);
  }

  static getActorEffects(actor) {
    return Array.from(actor?.allApplicableEffects() ?? []);
  }

  /**
 * Asynchronously gets a new target and updates workflow data.
 *
 * @param {Object} item - The item to get the new target for
 * @return {Token|undefined} The new target, or undefined if no new target is found
 */
  static async getNewMidiQOLWorkflowTarget(workflow, item, oldToken, targetTitle = undefined) {
    workflow.targets.delete(oldToken);
    workflow.saves.delete(oldToken);
    workflow.hitTargets.delete(oldToken);
    await DDBEffectHelper.displayItemCard(item);
    await MidiQOL.resolveTargetConfirmation(item, { forceDisplay: true, title: targetTitle });

    const newToken = game.user.targets.first();
    if (!newToken) return undefined;
    workflow.targets.add(newToken);
    workflow.hitTargets.add(newToken);
    workflow.saveResults = workflow.saveResults.filter((e) => e.data.tokenId !== oldToken.id);
    return newToken;
  }

  static effectConditionAppliedAndActive(conditionName, actor) {
    return actor.effects.some(
      (activeEffect) =>
        activeEffect?.flags?.isConvenient
        && activeEffect?.name == conditionName
        && !activeEffect?.disabled
    );
  }

  /**
   * Finds effects for the given actor and names.
   *
   * @param {Actor} actor - The actor to find effects for.
   * @param {string[]} names - An array of effect names to search for.
   * @return {object[]} - An array of effects matching the given names.
   */
  static findEffects(actor, names) {
    const results = [];
    for (const name of names) {
      if (DDBEffectHelper.findEffect(actor, name)) {
        results.push(DDBEffectHelper.findEffect(actor, name));
      }
    }
    return results;
  }

  /**
   * Return actor from a UUID
   *
   * @param {string} uuid - The UUID of the actor.
   * @return {object|null} - Returns the actor document or null if not found.
   */
  static fromActorUuid(uuid) {
    const doc = fromUuidSync(uuid);
    if (doc instanceof CONFIG.Token.documentClass) return doc.actor;
    if (doc instanceof CONFIG.Actor.documentClass) return doc;
    return null;
  }

  /**
   * Returns the actor object associated with the given actor reference.
   *
   * @param {any} actorRef - The actor reference to retrieve the actor from.
   * @return {Actor|null} The actor object associated with the given actor reference, or null if no actor is found.
   */
  static getActor(actorRef) {
    if (actorRef instanceof Actor) return actorRef;
    if (actorRef instanceof Token) return actorRef.actor;
    if (actorRef instanceof TokenDocument) return actorRef.actor;
    if (utils.isString(actorRef)) return DDBEffectHelper.fromActorUuid(actorRef);
    return null;
  }

  /**
   * Retrieves the number of cantrip dice based on the level of the actor.
   *
   * @param {Actor} actor - The actor object
   * @return {number} The number of cantrip dice.
   */
  static getCantripDice(actor) {
    const level = actor.type === "character"
      ? actor.system.details.level
      : actor.system.details.cr;
    return 1 + Math.floor((level + 1) / 6);
  }

  /**
   * This is a simple reworking of midi-qols measureDistances function, for use where midi-qol is not available
   * Measure distances for given segments with optional grid spaces.
   *
   * @param {Array} segments - Array of segments to measure distances for
   * @param {Object} options - Optional object with grid spaces configuration
   * @return {Array} Array of distances for each segment
   */
  static simpleMeasureDistances(segments, options = {}) {
    if (canvas?.grid?.grid.constructor.name !== "BaseGrid" || !options.gridSpaces) {
      const distances = canvas?.grid?.measureDistances(segments, options);
      return distances;
    }

    const rule = canvas?.grid.diagonalRule;
    if (!options.gridSpaces || !["555", "5105", "EUCL"].includes(rule)) {
      return canvas?.grid?.measureDistances(segments, options);
    }
    // Track the total number of diagonals
    let nDiagonal = 0;
    const d = canvas?.dimensions;

    const grid = canvas?.scene?.grid;
    if (!d || !d.size) return 0;

    // Iterate over measured segments
    return segments.map((s) => {
      const r = s.ray;
      // Determine the total distance traveled
      const nx = Math.ceil(Math.max(0, Math.abs(r.dx / d.size)));
      const ny = Math.ceil(Math.max(0, Math.abs(r.dy / d.size)));
      // Determine the number of straight and diagonal moves
      const nd = Math.min(nx, ny);
      const ns = Math.abs(ny - nx);
      nDiagonal += nd;

      if (rule === "5105") { // Alternative DMG Movement
        const nd10 = Math.floor(nDiagonal / 2) - Math.floor((nDiagonal - nd) / 2);
        const spaces = (nd10 * 2) + (nd - nd10) + ns;
        return spaces * d.distance;
      } else if (rule === "EUCL") { // Euclidean Measurement
        const nx = Math.max(0, Math.abs(r.dx / d.size));
        const ny = Math.max(0, Math.abs(r.dy / d.size));
        return Math.ceil(Math.hypot(nx, ny) * grid?.distance);
      } else { // Standard PHB Movement
        return Math.max(nx, ny) * grid.distance;
      }
    });
  }

  /**
   * Get the distance segments between two objects.
   *
   * @param {Object} t1 - the first token
   * @param {Object} t2 - the second token
   * @param {boolean} wallBlocking - whether to consider walls as blocking
   * @return {Array} an array of segments representing the distance between the two objects
   */
  static _getDistanceSegments(t1, t2, wallBlocking = false) {
    const t1StartX = t1.document.width >= 1 ? 0.5 : t1.document.width / 2;
    const t1StartY = t1.document.height >= 1 ? 0.5 : t1.document.height / 2;
    const t2StartX = t2.document.width >= 1 ? 0.5 : t2.document.width / 2;
    const t2StartY = t2.document.height >= 1 ? 0.5 : t2.document.height / 2;
    let x, x1, y, y1;
    let segments = [];
    for (x = t1StartX; x < t1.document.width; x++) {
      for (y = t1StartY; y < t1.document.height; y++) {
        const origin = new PIXI.Point(...canvas.grid.getCenter(Math.round(t1.document.x + (canvas.dimensions.size * x)), Math.round(t1.document.y + (canvas.dimensions.size * y))));
        for (x1 = t2StartX; x1 < t2.document.width; x1++) {
          for (y1 = t2StartY; y1 < t2.document.height; y1++) {
            const dest = new PIXI.Point(...canvas.grid.getCenter(Math.round(t2.document.x + (canvas.dimensions.size * x1)), Math.round(t2.document.y + (canvas.dimensions.size * y1))));
            const r = new Ray(origin, dest);
            // eslint-disable-next-line max-depth
            if (wallBlocking) {
              const collisionCheck = CONFIG.Canvas.polygonBackends.move.testCollision(origin, dest, { mode: "any", type: "move" });
              // eslint-disable-next-line max-depth, no-continue
              if (collisionCheck) continue;
            }
            segments.push({ ray: r });
          }
        }
      }
    }
    return segments;
  }

  /**
   * Calculate the height difference between two tokens based on their elevation and dimensions.
   *
   * @param {type} t1 - description of parameter t1
   * @param {type} t2 - description of parameter t2
   * @return {type} the height difference between the two tokens
   */
  static _calculateTokeHeightDifference(t1, t2) {
    const t1Elevation = t1.document.elevation ?? 0;
    const t2Elevation = t2.document.elevation ?? 0;
    const t1TopElevation = t1Elevation + (Math.max(t1.document.height, t1.document.width) * (canvas?.dimensions?.distance ?? 5));
    const t2TopElevation = t2Elevation + (Math.min(t2.document.height, t2.document.width) * (canvas?.dimensions?.distance ?? 5));

    let heightDifference = 0;
    let t1ElevationRange = Math.max(t1.document.height, t1.document.width) * (canvas?.dimensions?.distance ?? 5);
    if (Math.abs(t2Elevation - t1Elevation) < t1ElevationRange) {
      // token 2 is within t1's size so height difference is functionally 0
      heightDifference = 0;
    } else if (t1Elevation < t2Elevation) { // t2 above t1
      heightDifference = t2Elevation - t1TopElevation;
    } else if (t1Elevation > t2Elevation) { // t1 above t2
      heightDifference = t1Elevation - t2TopElevation;
    }

    return heightDifference;

  }

  /**
   * This is a simple reworking of midi-qols get distance function, for use where midi-qol is not available
   * Calculate the distance between two tokens on the canvas, considering the presence of walls.
   *
   * @param {string} token1 - The ID of the first token
   * @param {string} token2 - The ID of the second token
   * @param {boolean} wallBlocking - Whether to consider walls as obstacles (default is false)
   * @return {number} The calculated distance between the two tokens
   */
  static getSimpleDistance(token1, token2, wallBlocking = false) {
    if (!canvas || !canvas.scene) return -1;
    if (!canvas.grid || !canvas.dimensions) return -1;
    const t1 = DDBEffectHelper.getToken(token1);
    const t2 = DDBEffectHelper.getToken(token2);
    if (!t1 || !t2) return -1;
    if (!canvas || !canvas.grid || !canvas.dimensions) return -1;

    const segments = DDBEffectHelper._getDistanceSegments(t1, t2, wallBlocking);
    if (segments.length === 0) return -1;

    const rayDistances = segments.map((ray) => DDBEffectHelper.simpleMeasureDistances([ray], { gridSpaces: true }));
    let distance = Math.min(...rayDistances);

    const heightDifference = DDBEffectHelper._calculateTokeHeightDifference(t1, t2);

    const distanceRule = canvas.grid.diagonalRule;
    // 5105 Alternative DMG Movement
    // 555 Standard Movement
    // EUCL Euclidean Measurement
    if (["555", "5105"].includes(distanceRule)) {
      let nd = Math.min(distance, heightDifference);
      let ns = Math.abs(distance - heightDifference);
      distance = nd + ns;
      let dimension = canvas?.dimensions?.distance ?? 5;
      if (distanceRule === "5105") distance += Math.floor(nd / 2 / dimension) * dimension;
    } else {
      // assumes euclidean
      distance = Math.sqrt((heightDifference * heightDifference) + (distance * distance));
    }

    return distance;
  }

  static getDistance(token1, token2, wallsBlocking = false) {
    if (game.modules.get("midi-qol")?.active) {
      return MidiQOL.computeDistance(token1, token2, wallsBlocking);
    } else {
      return DDBEffectHelper.getSimpleDistance(token1, token2, wallsBlocking);
    }
  }

  /**
   * Returns the highest ability of an actor based on the given abilities.
   *
   * @param {Object} actor - The actor object.
   * @param {Array|string} abilities - The abilities array or string.
   * @return {string|undefined} - The highest ability or undefined if no abilities are provided.
   */
  static getHighestAbility(actor, abilities) {
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

  /**
   * Returns the race or type of the given entity.
   *
   * @param {object} entity - The entity for which to retrieve the race or type.
   * @return {string} The race or type of the entity, in lowercase.
   */
  static getRaceOrType(entity) {
    const actor = DDBEffectHelper.getActor(entity);
    const systemData = actor?.system;
    if (!systemData) return "";
    if (systemData.details.race) {
      return (systemData.details?.race?.name ?? systemData.details?.race)?.toLocaleLowerCase() ?? "";
    }
    return systemData.details.type?.value.toLocaleLowerCase() ?? "";
  }

  /**
   * Retrieves the token based on the provided token reference.
   *
   * @param {any} tokenRef - The token reference to retrieve the token from.
   * @return {Token|undefined} The retrieved token if it exists, otherwise undefined.
   */
  static getToken(tokenRef) {
    if (!tokenRef) return undefined;
    if (tokenRef instanceof Token) return tokenRef;
    if (utils.isString(tokenRef)) return (fromUuidSync(tokenRef)?.object);
    if (tokenRef instanceof TokenDocument) return tokenRef.object;
    return undefined;
  }

  /**
   * Retrieves the TokenDocument associated with the given token reference.
   *
   * @param {any} tokenRef - The token reference to retrieve the TokenDocument for.
   * @return {TokenDocument|undefined} The TokenDocument associated with the token reference, or undefined if not found.
   */
  static getTokenDocument(tokenRef) {
    if (!tokenRef) return undefined;
    if (tokenRef instanceof TokenDocument) return tokenRef;
    if (typeof tokenRef === "string") {
      const document = fromUuidSync(tokenRef);
      if (document instanceof TokenDocument) return document;
      if (document instanceof Actor) return DDBEffectHelper.getTokenForActor(document)?.document;
    }
    if (tokenRef instanceof Token) return tokenRef.document;
    return undefined;
  }

  /**
   * Returns a token for the provided actor.
   *
   * @param {Actor} actor - The actor for which to retrieve the token.
   * @return {Token|undefined} The token associated with the actor, or undefined if no token is found.
   */
  static getTokenForActor(actor) {
    const tokens = actor.getActiveTokens();
    if (!tokens.length) return undefined;
    const controlled = tokens.filter((t) => t._controlled);
    return controlled.length ? controlled.shift() : tokens.shift();
  }

  /**
   * Get the image for the token.
   *
   * @param {object} token - The token for which to get the image.
   * @return {string} The image URL for the token.
   */
  static async getTokenImage(token) {
    const midiConfigSettings = game.settings.get("midi-qol", "ConfigSettings");
    let img = token.document?.texture?.src ?? token.actor.img ?? "";
    if (midiConfigSettings.usePlayerPortrait && token.actor.type === "character") {
      img = token.actor?.img ?? token.document?.texture?.src ?? "";
    }
    if (VideoHelper.hasVideoExtension(img)) {
      img = await game.video.createThumbnail(img, { width: 100, height: 100 });
    }
    return img;
  }

  /**
   * Retrieves the type or race of the given entity.
   *
   * @param {any} entity - The entity to retrieve the type or race from.
   * @return {string} The type or race of the entity, in lowercase. If the type or race is not available, an empty string is returned.
   */
  static getTypeOrRace(entity) {
    const actor = DDBEffectHelper.getActor(entity);
    const systemData = actor?.system;
    if (!systemData) return "";
    if (systemData.details.type?.value) {
      return systemData.details.type?.value.toLocaleLowerCase() ?? "";
    }
    return (systemData.details?.race?.name ?? systemData.details?.race)?.toLocaleLowerCase() ?? "";
  }

  /**
 * Returns a new duration which reflects the remaining duration of the specified one.
 *
 * @param {*} duration the source duration
 * @returns a new duration which reflects the remaining duration of the specified one.
 */
  static getRemainingDuration(duration) {
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


  /**
   * Returns true if the attack is a ranged weapon attack that hit. It also supports melee weapons
   * with the thrown property.
   * @param {*} macroData the midi-qol macro data.
   * @returns true if the attack is a ranged weapon attack that hit
   */
  static isRangedWeaponAttack(macroData) {
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
    const distance = MidiQOL.computeDistance(sourceToken, targetToken, true);
    const meleeDistance = 5; // Would it be possible to have creatures with reach and thrown weapon?
    return distance >= 0 && distance > meleeDistance;
  }

  /**
   * Check if actor a is smaller than b based on their sizes.
   *
   * @param {type} a
   * @param {type} b
   * @return {boolean} true if a is smaller than b, false otherwise
   */
  static isSmaller (a, b) {
    const sizeA = DICTIONARY.SIZES.find((s) => s.value === a.system.traits.size)?.size;
    const sizeB = DICTIONARY.SIZES.find((s) => s.value === b.system.traits.size)?.size;
    return sizeA < sizeB;
  }

  /**
   * If the requirements are met, returns true, false otherwise.
   *
   * @returns true if the requirements are met, false otherwise.
   */
  static requirementsSatisfied(name, dependencies) {
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

  /**
   * Asynchronously rolls a saving throw for an item.
   *
   * @param {Object} item - The item for which the saving throw is rolled
   * @param {Object} targetToken - The token representing the target of the saving throw
   * @param {Object} [workflow=null] - The workflow for which the saving throw is rolled
   * @return {Promise} A promise that resolves with the save result
   */
  static async rollSaveForItem(item, targetToken, workflow = null) {
    const { ability, dc } = foundry.utils.duplicate(item.system.save);
    const userID = MidiQOL.playerForActor(targetToken.actor)?.active
      ? MidiQOL.playerForActor(targetToken.actor).id
      : game.users.activeGM.id;
    const data = {
      request: "save",
      targetUuid: targetToken.document.uuid,
      ability,
      options: {
        name: "Reflect",
        skipDialogue: true,
        targetValue: dc,
      },
    };

    const save = await MidiQOL.socket().executeAsUser("rollAbility", userID, data);
    if (workflow) workflow.saveResults.push(save);
    return save;
  }


  /**
   * Selects all the tokens that are within X distance of the source token for the current game user.
   * @param {Token} sourceToken the reference token from which to compute the distance.
   * @param {number} distance the distance from the reference token.
   * @param {boolean} includeSource flag to indicate if the reference token should be included or not in the selected targets.
   * @returns an array of Token instances that were selected.
   */
  static selectTargetsWithinX(sourceToken, distance, includeSource) {
    let aoeTargets = MidiQOL.findNearby(null, sourceToken, distance);
    if (includeSource) {
      aoeTargets.unshift(sourceToken);
    }
    const aoeTargetIds = aoeTargets.map((t) => t.document.id);
    game.user?.updateTokenTargets(aoeTargetIds);
    game.user?.broadcastActivity({ aoeTargetIds });
    return aoeTargets;
  }

  static updateUserTargets(targets) {
    game.user.updateTokenTargets(targets);
  }

  static async wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  static isConditionEffectAppliedAndActive(condition, actor) {
    // return actor.statuses.has(condition.toLowerCase());
    return DDBEffectHelper.getActorEffects(actor).some(
      (activeEffect) =>
        // (foundry.utils.getProperty(activeEffect, "flags.dfreds-convenient-effects.isConvenient") || activeEffect?.flags?.isConvenient)
        (activeEffect?.name.toLowerCase() == condition.toLowerCase())
        && !activeEffect?.disabled
    );
  }

  static getConditionEffectAppliedAndActive(condition, actor) {
    // return actor.statuses.has(condition.toLowerCase());
    return DDBEffectHelper.getActorEffects(actor).find(
      (activeEffect) =>
        // (foundry.utils.getProperty(activeEffect, "flags.dfreds-convenient-effects.isConvenient") || activeEffect?.flags?.isConvenient)
        (activeEffect?.name.toLowerCase() == condition.toLowerCase())
        && !activeEffect?.disabled
    );
  }

  static extractListItems(text, { type = "ol", titleType = "em" } = {}) {
    const results = [];
    const parsedDoc = utils.htmlToDoc(text);
    const list = parsedDoc.body.querySelector(type);
    if (list) {
      const listItems = list.querySelectorAll('li');
      listItems.forEach((item, index) => {
        // console.log('Item ' + (index + 1) + ': ' + item.textContent);
        const title = item.querySelector(titleType);
        const content = title.nextSibling;
        results.push({
          number: index + 1,
          title: title.textContent.replace(/\.$/, "").trim(),
          content: content.innerHTML ?? content.wholeText ?? content.textContent,
          full: item.innerHTML,
        });
      });
    }
    return results;
  }

  static syntheticItemWorkflowOptions({ targets = undefined, showFullCard = false, useSpellSlot = false, castLevel = false, consume = false, configureDialog = false } = {}) {
    return [
      {
        showFullCard,
        createWorkflow: true,
        consumeResource: consume,
        consumeRecharge: consume,
        consumeQuantity: consume,
        consumeUsage: consume,
        consumeSpellSlot: useSpellSlot,
        consumeSpellLevel: castLevel,
        slotLevel: castLevel,
      },
      {
        targetUuids: targets,
        configureDialog,
        workflowOptions: {
          autoRollDamage: 'always',
          autoFastDamage: true,
          autoRollAttack: true,
        }
      }
    ];
  }
}
