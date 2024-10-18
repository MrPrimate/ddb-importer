import DialogHelper from "../lib/DialogHelper.js";
import DICTIONARY from "../dictionary.js";
import FolderHelper from "../lib/FolderHelper.js";
import utils from "../lib/utils.js";
import logger from "../logger.js";
import { midiItemEffects } from "./specialEquipment.js";
import { spellEffectAdjustment } from "./specialSpells.js";
import { addVision5eStub } from "./vision5e.js";
import { addExtraEffects } from "../parser/features/extraEffects.js";
import { generateOverTimeEffect, damageOverTimeEffect, getOvertimeDamage, getMonsterFeatureDamage } from "./monsterFeatures/overTimeEffect.js";
import { baseEffect, generateDAEStatusEffectChange, addStatusEffectChange, generateTokenMagicFXChange, generateATLChange } from "./effects.js";
import ExternalAutomations from "./external/ExternalAutomations.js";
import Crosshairs from "../lib/Crosshairs.js";

export default class DDBEffectHelper {

  static baseEffect = baseEffect;

  static Crosshairs = Crosshairs;

  static generateOverTimeEffect = generateOverTimeEffect;

  static getOvertimeDamage = getOvertimeDamage;

  static getMonsterFeatureDamage = getMonsterFeatureDamage;

  static damageOverTimeEffect = damageOverTimeEffect;

  static generateDAEStatusEffectChange = generateDAEStatusEffectChange;

  static addStatusEffectChange = addStatusEffectChange;

  static generateTokenMagicFXChange = generateTokenMagicFXChange;

  static generateATLChange = generateATLChange;

  static addToProperties = utils.addToProperties;

  static removeFromProperties = utils.removeFromProperties;

  static wait = utils.wait;

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
        // KNOWN_ISSUE_4_0 equipmentEffectAdjustment(data); // removed, no longer called
        data = await midiItemEffects(data);
        // KNOWN_ISSUE_4_0: fix items removed here, this is now included earlier in teh item parser
      } else if (data.type === "spell") {
        data = await spellEffectAdjustment(data, true);
        // await fixSpells(null, [data]); //moved into parsing
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

        // KNOWN_ISSUE_4_0 await fixFeatures([data]); // removed, no longer called
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
      img: icon,
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

  static getSceneTargets() {
    let targets = canvas.tokens.controlled.filter((t) => t.actor);
    if (targets.length && game.user.character) targets = game.user.character.getActiveTokens();
    return targets;
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


  // eslint-disable-next-line no-unused-vars
  static getConcentrationEffect(actor, _name = null) {
    return actor?.effects.find((ef) => foundry.utils.getProperty(ef, "flags.midi-qol.isConcentration"));
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

  static isConditionEffectAppliedAndActive(condition, actor) {
    return DDBEffectHelper.getActorEffects(actor).some(
      (activeEffect) =>
        (activeEffect?.name.toLowerCase() == condition.toLowerCase())
        && !activeEffect?.disabled,
    );
  }

  static getConditionEffectAppliedAndActive(condition, actor) {
    return DDBEffectHelper.getActorEffects(actor).find(
      (activeEffect) =>
        (activeEffect?.name.toLowerCase() == condition.toLowerCase())
        && !activeEffect?.disabled,
    );
  }

  static async removeCondition({ actor, actorUuid, conditionName, level = null } = {}) {
    if (!actor) actor = await fromUuid(actorUuid);
    if (!actor) {
      logger.error("No actor passed to remove condition");
      return;
    }
    const condition = CONFIG.statusEffects.find((se) => se.name.toLowerCase() === conditionName.toLowerCase());

    if (!condition) {
      logger.error(`Condition ${conditionName} not found`);
      return;
    }

    logger.debug(`removing ${condition.name}`, { condition });
    const existing = actor.document?.effects?.get(game.dnd5e.utils.staticID(`dnd5e${condition.id}`));
    if (existing) await existing.delete();
    if (condition.id === "exhaustion") {
      logger.debug("Reducing exhaustion", level);
      await actor.update({ "system.attributes.exhaustion": level ?? 0 });
    }
  }

  static async addCondition({ conditionName, actor, actorUuid, level = null, origin = null } = {}) {
    if (!actor) actor = await fromUuid(actorUuid);
    if (!actor) {
      logger.error("No actor passed to remove condition");
      return;
    }

    const condition = CONFIG.statusEffects.find((se) => se.name.toLowerCase() === conditionName.toLowerCase());

    if (!condition) {
      logger.error(`Condition ${conditionName} not found`);
      return;
    }

    logger.debug(`adding ${condition.name}`, { condition });
    const effect = await ActiveEffect.implementation.fromStatusEffect(condition.id);
    if (condition.level) effect.updateSource({ [`flags.dnd5e.${condition.id}Level`]: condition.level });
    effect.updateSource({ origin });
    const effectData = effect.toObject();
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData], { keepId: true });
    if (condition.foundry === "exhaustion") {
      logger.debug("Updating actor exhaustion", level);
      await actor.update({ "system.attributes.exhaustion": level ?? 1 });
    }
  }

  static async adjustCondition({ add = false, remove = false, actor, conditionName, level = null, origin = null } = {}) {
    const gmUser = game.users.find((user) => user.active && user.isGM);
    if (!gmUser) {
      ui.notifications.error("No GM user found, unable to adjust condition");
      return;
    }
    if (!add && !remove) {
      logger.warn("You must specify if you want to add or remove the condition");
      return;
    }
    logger.debug("Adjusting condition", { add, remove, actor, conditionName, level, origin });
    if (remove) {
      logger.debug("Removing condition", { actor, conditionName, level });
      await globalThis.DDBImporter.socket.executeAsGM("removeCondition", { actorUuid: actor.uuid, conditionName, level });
    }
    if (add) {
      logger.debug("Adding condition", { actor, conditionName, level, origin });
      await globalThis.DDBImporter.socket.executeAsGM("addCondition", { actorUuid: actor.uuid, conditionName, level, origin });
    }
    logger.debug("Condition adjusted", { add, remove, actor, conditionName, level, origin });

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
    if (results.length > 0) return results;
    return DDBEffectHelper.extractParagraphItems(text, { titleType });
  }

  static extractParagraphItems(text, { type = "p", titleType = "em" } = {}) {
    const results = [];
    const parsedDoc = utils.htmlToDoc(text);

    const listItems = parsedDoc.querySelectorAll(type);
    let i = 1;
    for (const item of listItems) {
      const title = item.querySelector(titleType);
      // eslint-disable-next-line no-continue
      if (!title) continue;
      const content = title.nextSibling;
      results.push({
        number: i,
        title: title.textContent.replace(/\.$/, "").trim(),
        content: content.innerHTML?.trim() ?? content.wholeText?.trim() ?? content.textContent?.trim(),
        full: item.innerHTML,
      });
      i++;
    }

    return results;
  }

  static async _verySimpleDamageRollToChat({ actor, flavor, formula, damageType = "damage", item, itemId, itemUuid } = {}) {
    const roll = new CONFIG.Dice.DamageRoll(formula, {}, { type: damageType });
    await roll.evaluate({ async: true });

    if (!item && itemId && !itemUuid && actor) {
      item = actor.getEmbeddedDocument("Item", itemId);
    }
    if (!item && itemUuid && actor) {
      item = await fromUuid(itemUuid);
    }

    if (item && !itemId) itemId = item._id;
    if (item && !itemUuid) itemUuid = item.uuid;

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor,
      "flags.dnd5e": {
        targets: dnd5e.utils.getTargetDescriptors(),
        roll: {
          type: "damage",
          itemId,
          itemUuid,
        },
      },

    });
  }

  static async simpleDamageRollToChat({ event = undefined, actor, flavor, formulas = [], damageType = "damage", item, itemId, itemUuid, fastForward = false } = {}) {

    if (!item && itemId && !itemUuid && actor) {
      item = actor.getEmbeddedDocument("Item", itemId);
    }
    if (!item && itemUuid && actor) {
      item = await fromUuid(itemUuid);
    }

    if (item && !itemId) itemId = item._id;
    if (item && !itemUuid) itemUuid = item.uuid;

    const isHealing = damageType in CONFIG.DND5E.healingTypes;
    const title = game.i18n.localize(`DND5E.${isHealing ? "Healing" : "Damage"}Roll`);
    const rollConfig = {
      rollConfigs: [{
        parts: formulas,
        type: damageType,
      }],
      flavor: flavor ?? title,
      event,
      title,
      fastForward,
      messageData: {
        "flags.dnd5e": {
          targets: dnd5e.utils.getTargetDescriptors(),
          roll: { type: "damage", itemId, itemUuid },
        },
        speaker: ChatMessage.implementation.getSpeaker(),
      },
    };

    if (Hooks.call("dnd5e.preRollDamage", undefined, rollConfig) === false) return;
    const roll = await globalThis.dnd5e.dice.damageRoll(rollConfig);
    if (roll) Hooks.callAll("dnd5e.rollDamage", undefined, roll);
  }

  static syntheticItemWorkflowOptions({
    targets = undefined, showFullCard = false, useSpellSlot = false, castLevel = false, consume = false,
    configureDialog = false, targetConfirmation = undefined,
  } = {}) {
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
          targetConfirmation,
        },
      },
    ];
  }

  static overTimeDamage({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc } = {}) {
    return {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `turn=${turn},label=${document.name} (${utils.capitalize(turn)} of Turn),damageRoll=${damage},damageType=${damageType},saveRemove=${saveRemove},saveDC=${dc},saveAbility=${saveAbility},saveDamage=${saveDamage},killAnim=true`,
      priority: "20",
    };
  }

  static overTimeSave({ document, turn, saveAbility, saveRemove = true, dc } = {}) {
    const turnValue = turn === "action" ? "end" : turn;
    const actionSave = turn === "action" ? ",actionSave=true" : "";
    return {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `turn=${turnValue},label=${document.name} (${utils.capitalize(turn)} of Turn),saveRemove=${saveRemove},saveDC=${dc},saveAbility=${saveAbility},killAnim=true${actionSave}`,
      priority: "20",
    };
  }

  static startOrEnd(text) {
    const re = /at the (start|end) of each/i;
    const match = text.match(re);
    if (match) {
      return match[1];
    } else {
      return undefined;
    }
  }

  static overTimeSaveEnd({ document, effect, save, text }) {
    const saveSearch = /repeat the saving throw at the (end|start) of each/;
    const match = text.match(saveSearch);
    if (match) {
      effect.changes.push(DDBEffectHelper.overTimeSave({ document, turn: match[1], saveAbility: save.ability, dc: save.dc }));
    } else {
      const actionSaveSearch = /can use its action to repeat the saving throw/;
      const actionSaveMatch = text.match(actionSaveSearch);
      if (actionSaveMatch) {
        effect.changes.push(DDBEffectHelper.overTimeSave({ document, turn: "action", saveAbility: save.ability, dc: save.dc }));
      }
    }
  }


  static getSpecialDuration(effect, match) {
    // minutes
    if (match[7]
      && (match[7].includes("until the end of its next turn")
      || match[7].includes("until the end of the target's next turn"))
    ) {
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnEnd"]);
    } else if (match[7] && match[7].includes("until the start of the")) {
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnStartSource"]);
    }
    return effect;
  }


  static DEFAULT_DURATION_SECONDS = 60;

  static getDuration(text, returnDefault = true) {
    const result = {
      type: returnDefault ? "second" : null,
      second: returnDefault ? DDBEffectHelper.DEFAULT_DURATION_SECONDS : null,
      round: returnDefault ? (DDBEffectHelper.DEFAULT_DURATION_SECONDS / 6) : null,
      minute: null,
      hour: null,
      special: "",
      value: null,
      units: "inst",
    };
    const re = /for (\d+) (minute|hour|round|day|month|year)/; // turn|day|month|year
    const match = text.match(re);
    if (match) {
      let seconds = parseInt(match[1]);
      result.type = match[2];
      result.units = match[2];
      result.value = match[1];
      switch (match[2]) {
        case "minute": {
          result.minute = match[1];
          seconds *= 60;
          break;
        }
        case "hour": {
          result.hour = match[1];
          seconds *= 60 * 60;
          break;
        }
        case "round": {
          seconds *= 6;
          result.round = match[1];
          break;
        }
        case "turn": {
          result.turns = match[1];
          break;
        }
        case "day": {
          result.day = match[1];
          seconds *= 60 * 60 * 24;
          break;
        }
        case "year": {
          result.year = match[1];
          seconds *= 60 * 60 * 24 * 365;
          break;
        }
        case "month": {
          result.month = match[1];
          seconds *= 60 * 60 * 24 * 30;
          break;
        }
        // no default
      }

      result.second = seconds;
      return result;
    }

    const smallMatchRe = /until the (?:end|start) of its next turn|until the (?:end|start) of the target's next turn|until the (?:end|start) of your next turn/ig;
    const smallMatch = smallMatchRe.exec(text);
    if (smallMatch) {
      result.type = "special";
      result.units = "spec";
      result.second = 6;
      result.round = 1;
      result.special = smallMatch[0];
      return result;
    }
    return result;
  }

  // A selection of example conditions
  // DC 18 Strength saving throw or be knocked prone
  // DC 14 Constitution saving throw or become poisoned for 1 minute.
  // DC 12 Constitution saving throw or be poisoned for 1 minute
  // DC 15 Wisdom saving throw or be frightened until the end of its next turn.
  // DC 15 Charisma saving throw or be charmed
  // DC 12 Charisma saving throw or become cursed
  // DC 10 Intelligence saving throw or it can’t take a reaction until the end of its next turn
  // DC 12 Constitution saving throw or contract bluerot
  // DC 17 Strength saving throw or be thrown up to 30 feet away in a straight line
  // DC 13 Constitution saving throw or lose the ability to use reactions until the start of the weird’s
  // DC 16 Wisdom saving throw or move 1 round forward in time
  // DC 15 Constitution saving throw, or for 1 minute, its speed is reduced by 10 feet; it can take either an action or a bonus action on each of its turns, not both; and it can’t take reactions.
  // DC 15 Constitution saving throw or have disadvantage on its attack rolls until the end of its next turn
  // DC 15 Wisdom saving throw or be frightened until the end of its next turn
  // DC 13 Strength saving throw or take an extra 3 (1d6) piercing damage and be grappled (escape DC 13)
  // DC 15 Constitution saving throw or gain 1 level of exhaustion
  // DC 20 Constitution saving throw or be paralyzed for 1 minute
  // DC 17 Constitution saving throw or be cursed with loup garou lycanthropy
  // DC 12 Constitution saving throw or be cursed with mummy rot
  // DC 18 Strength saving throw or be swallowed by the neothelid. A swallowed creature is blinded and restrained, it has total cover against attacks and other effects outside the neothelid, and it takes 35 (10d6) acid damage at the start of each of the neothelid’s turns.</p><p>If the neothelid takes 30 damage or more on a single turn from a creature inside it, the neothelid must succeed on a DC 18 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the neothelid. If the neothelid dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 20 feet of movement, exiting prone.
  // (before DC) it can’t regain hit points for 1 minute
  // DC 14 Dexterity saving throw or suffer one additional effect of the shadow dancer’s choice:</p><ul>\n<li>The target is grappled (escape DC 14) if it is a Medium or smaller creature. Until the grapple ends, the target is restrained, and the shadow dancer can’t grapple another target.</li>\n<li>The target is knocked prone.</li>\n<li>The target takes 22 (4d10) necrotic damage.</li>\n</ul>\n</section>\nThe Shadow Dancer attacks with its Spiked Chain.
  // DC 15 Constitution saving throw or be stunned until the end of its next turn.
  // DC 15 Constitution saving throw or die.
  // DC 20 Strength saving throw or be pulled up to 25 feet toward the balor.
  // DC 11 Constitution saving throw or be poisoned until the end of the target’s next turn.
  // DC 14 Wisdom saving throw or be frightened of the quori for 1 minute.
  // DC 13 Constitution saving throw or be poisoned for 1 hour. If the saving throw fails by 5 or more, the target is also unconscious while poisoned in this way. The target wakes up if it takes damage or if another creature takes an action to shake it awake.


  static dcParser({ text } = {}) {
    const results = {
      save: {
        dc: {
          formula: "",
          calculation: "",
        },
        ability: null,
      },
      match: null,
    };

    let parserText = utils.nameString(text)
      .replaceAll("[condition]", "")
      .replaceAll("[/condition]", "")
      .replaceAll("[save]", "")
      .replaceAll("[/save]", "")
      .replaceAll("[/action]", "")
      .replaceAll("[action]", "");
    const conditionSearch = /\[\[\/save (?<ability>\w+) (?<dc>\d\d) format=long\]\](?:,)? or (?<hint>have the|be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(?:&(?:amp;)?Reference\[(?<condition>\w+)\]{\w+})?\s?(?:for (\d+) (minute|round|hour)| until)?(.*)?(?:.|$)/ig;
    let match = conditionSearch.exec(parserText);
    if (!match) {
      const rawConditionSearch = /DC (?<dc>\d+) (?<ability>\w+) (?<type>saving throw|check)(?:,)? or (?<hint>have the|be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(?<condition>\w+)?\s?(?:for (\d+) (minute|round|hour)| until)?(.*)?(?:.|$)/ig;
      match = rawConditionSearch.exec(parserText);
    }

    if (!match) {
      const rawNoDC = /(?<ability>\w+)? (?<type>saving throw|check)(?:,)? or (?<hint>have the|be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(?<condition>\w+)?\s?(?:for (\d+)\s?(minute|round|hour)| until)?(.*)?(?:.|$)/ig;
      match = rawNoDC.exec(parserText);
    }

    if (!match) {
      const rawConditionSearch2 = /(?<ability>\w+) (?<type>saving throw|check): DC (?<dc>\d+)(?:[ .,])(.*)Failure: The target has the (?<condition>\w+)(?: for (\d+) (minute|round|hour)| until)?/ig;
      match = rawConditionSearch2.exec(parserText);
    }

    if (!match) {
      const monsterAndCondition = /(the target has the|subject that creature to the) (?<condition>\w+) condition/ig;
      match = monsterAndCondition.exec(parserText);
    }

    if (!match) {
      const onHitSearch = /On a hit, the target is (?<condition>\w+)? until/ig;
      match = onHitSearch.exec(parserText);
    }

    if (!match) {
      const saveSearch = /On a failed save, a creature takes (\d+)?d(\d+) (\w+) damage and is (?<condition>\w+)(?: for (\d+) (minute|round|hour))?/ig;
      match = saveSearch.exec(parserText);
    }

    if (!match) {
      const successSearch = /succeed on a (?<ability>\w+) (?<type>saving throw|check)(?: \(DC equal to 8 \+ your proficiency bonus \+ your (?<modifier>\w+) modifier\))? or (?:be|become) (?<condition>\w+) (of you )?until /ig;
      match = successSearch.exec(parserText);
    }

    if (!match) {
      const snipetSearch = /succeed on a (?<ability>\w+) (?<type>saving throw|check) \(DC {{savedc:(?<modifier>\w+)}}\)? or be (?<condition>\w+) until/ig;
      match = snipetSearch.exec(parserText);
    }

    if (!match) {
      const spellcasterSearch = /a (?<ability>\w+) (?<type>saving throw|check) against your (?<spellcasting>spell save DC|spellcasting|spell casting)/ig;
      match = spellcasterSearch.exec(parserText);
    }

    if (match) {
      if (match.groups.type === "check") results.check = true;
      results.save = {
        dc: {
          formulas: match.groups["dc"] ?? "",
          calculation: match.groups["spellcasting"] ? "spellcasting" : (match.groups["modifier"]?.toLowerCase().substr(0, 3) ?? ""),
        },
        ability: match.groups["ability"]?.toLowerCase().substr(0, 3) ?? "",
      };
    }

    results.match = match;
    return results;
  }

  static parseStatusCondition({ text, nameHint = null } = {}) {
    let results = {
      success: false,
      check: false,
      save: {
        dc: {
          formula: "",
          calculation: "",
        },
        ability: null,
      },
      condition: null,
      effect: {
        name: "",
        changes: [],
        flags: {},
        statuses: [],
        duration: {
          seconds: null,
          rounds: null,
          turns: null,
          startRound: null,
          startTurn: null,
        },
      },
    };

    let parserText = utils.nameString(text);
    const matchResults = DDBEffectHelper.dcParser({ text: parserText });

    // console.warn("condition status", match);
    if (matchResults.match) {
      const match = matchResults.match;
      if (match.groups.type === "check") results.check = true;
      results.condition = match.groups["condition"];

      results.save = matchResults.save;
      // group 4 condition - .e.g. "DC 18 Strength saving throw or be knocked prone"
      const group4Condition = match.groups.condition
        ? DICTIONARY.character.damageAdjustments
          .filter((type) => type.type === 4)
          .find(
            (type) => type.name.toLowerCase() === match.groups.condition.toLowerCase()
              || type.foundryValue === match.groups.condition.toLowerCase(),
          )
        : undefined;
      if (group4Condition) {
        results.condition = group4Condition.value;
        DDBEffectHelper.addStatusEffectChange({ effect: results.effect, statusName: group4Condition.name });
        results.effect = DDBEffectHelper.getSpecialDuration(results.effect, match);
        if (nameHint) results.effect.name = `${nameHint}: ${group4Condition.name}`;
        else results.effect.name = `Status: ${group4Condition.name}`;
      } else if (match.groups.hint && match.groups.hint === "die") {
        DDBEffectHelper.addStatusEffectChange({ effect: results.effect, statusName: "Dead" });
        results.condition = "dead";
        if (nameHint) results.effect.name = `Status: Dead`;
      } else {
        logger.debug(`Odd condition ${results.condition} found`, {
          text,
          nameHint,
        });
        return results;
      }
      results.success = true;
      const duration = DDBEffectHelper.getDuration(parserText);
      foundry.utils.setProperty(results.effect, "duration.seconds", duration.second);
      foundry.utils.setProperty(results.effect, "duration.rounds", duration.round);
    }

    return results;
  }

}
