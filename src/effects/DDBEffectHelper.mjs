import {
  utils,
  logger,
  DialogHelper,
  Crosshairs,
  FolderHelper,
} from "../lib/_module.mjs";
import { DICTIONARY } from "../config/_module.mjs";
import DDBMonsterFeature from "../parser/monster/features/DDBMonsterFeature.js";
import { DDBDescriptions } from "../parser/lib/_module.mjs";
import { AutoEffects, ChangeHelper, MidiOverTimeEffect } from "../parser/enrichers/effects/_module.mjs";

export default class DDBEffectHelper {

  static baseEffect = AutoEffects.BaseEffect;

  static Crosshairs = Crosshairs;

  static generateDAEStatusEffectChange = ChangeHelper.daeStatusEffectChange;

  static addStatusEffectChange = ChangeHelper.addStatusEffectChange;

  static generateTokenMagicFXChange = ChangeHelper.tokenMagicFXChange;

  static generateATLChange = ChangeHelper.atlChange;

  static getMonsterFeatureDamage(damageText, featureDoc = null) {
    const preParsed = foundry.utils.getProperty(featureDoc, "flags.monsterMunch.actionInfo.damage");
    if (preParsed) return preParsed;
    logger.debug("Monster feature damage miss", { damageText, featureDoc });
    const feature = new DDBMonsterFeature("overTimeFeature", { html: damageText });
    feature.prepare();
    feature.generateDamageInfo();
    return feature.actionInfo.damageParts;
  }

  static getOvertimeDamage(text, featureDoc = null) {
    if (text.includes("taking") && (text.includes("on a failed save") || text.includes("damage on a failure"))) {
      const damageText = text.split("taking")[1];
      return DDBEffectHelper.getMonsterFeatureDamage(damageText, featureDoc);
    }
    return undefined;
  }


  static generateConditionOnlyEffect(actor, document, otherDescription = null) {
    const generator = new MidiOverTimeEffect({
      document,
      actor,
      otherDescription,
    });
    generator.generateConditionOnlyEffect();
  }

  // eslint-disable-next-line complexity
  static generateOverTimeEffect(actor, document, otherDescription = null) {
    const generator = new MidiOverTimeEffect({
      document,
      actor,
      otherDescription,
    });
    generator.generateOverTimeEffect();

  }

  static damageOverTimeEffect({ document, startTurn = false, endTurn = false, durationSeconds, damage,
    damageType, saveAbility, saveRemove = true, saveDamage = "nodamage", dc } = {},
  ) {
    return MidiOverTimeEffect.damageOverTimeEffect({ document, startTurn, endTurn, durationSeconds, damage, damageType, saveAbility, saveRemove, saveDamage, dc });
  }


  static addToProperties(properties, value) {
    return utils.addToProperties(properties, value);
  }

  static removeFromProperties(properties, value) {
    utils.removeFromProperties(properties, value);
  }

  static async wait(ms) {
    return utils.wait(ms);
  }

  /**
   * Adds a save advantage effect for the next save on the specified target actor.
   *
   * @param {Actor} targetActor The target actor on which to add the effect.
   * @param {Item} originItem The item that is the origin of the effect.
   * @param {string} ability The short ability name to use for save, e.g. str
   * @param {string} [additionLabel=""] A label to add to the effect name.
   * @param {string} [icon=null] An icon to use for the effect.
   * @returns {Promise<void>}
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
   * @param {any} token The token object.
   * @param {any} target The target object.
   * @param {any} item The item object.
   * @param {string} displayName The display name of the cover.
   * @returns {string|number} The cover bonus or the display name of the cover.
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
   * @param {object} item The item to display the card for
   * @returns {Promise} A promise that resolves when the card is displayed
   */
  static async displayItemCard(item) {
    const msg = await item.displayCard({ createMessage: false });
    const DIV = document.createElement("DIV");
    DIV.innerHTML = msg.content;
    DIV.querySelector("div.card-buttons").remove();
    await ChatMessage.create({ content: DIV.innerHTML });
  }

  /**
   * Identifies and returns the IDs of tokens that are contained within a given template.
   *
   * @param {object} templateDoc The template document used to determine token containment.
   * @returns {Array} An array of token IDs that are contained within the specified template.
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
   * @param {Actor} actor The actor to search for the effect.
   * @param {string} name The name of the effect to find.
   * @returns {Effect} - The effect with the specified name, or undefined if not found.
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
   * @param {object} workflow The workflow object to update
   * @param {object} item The item to get the new target for
   * @param {Token} oldToken The old token to remove from the workflow targets
   * @param {string} [targetTitle] An optional title to display in the target confirmation dialog
   *
   * @returns {Token|undefined} The new target, or undefined if no new target is found
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
   * @param {Actor} actor The actor to find effects for.
   * @param {string[]} names An array of effect names to search for.
   * @returns {object[]} An array of effects matching the given names.
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
   * @param {string} uuid The UUID of the actor.
   * @returns {object|null} Returns the actor document or null if not found.
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
   * @param {any} actorRef The actor reference to retrieve the actor from.
   * @returns {Actor|null} The actor object associated with the given actor reference, or null if no actor is found.
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
   * @param {Actor} actor The actor object
   * @returns {number} The number of cantrip dice.
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
   * @param {Array} segments Array of segments to measure distances for
   * @param {object} options Optional object with grid spaces configuration
   * @returns {Array} Array of distances for each segment
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
   * @param {object} t1 the first token
   * @param {object} t2 the second token
   * @param {boolean} wallBlocking whether to consider walls as blocking
   * @returns {Array} an array of segments representing the distance between the two objects
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
   * @param {type} t1 description of parameter t1
   * @param {type} t2 description of parameter t2
   * @returns {type} the height difference between the two tokens
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
   * @param {string} token1 The ID of the first token
   * @param {string} token2 The ID of the second token
   * @param {boolean} wallBlocking Whether to consider walls as obstacles (default is false)
   * @returns {number} The calculated distance between the two tokens
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

  static getDistance(token1, token2, wallsBlock = false, includeCover = false) {
    if (game.modules.get("midi-qol")?.active) {
      return MidiQOL.computeDistance(token1, token2, { wallsBlock, includeCover });
    } else {
      return DDBEffectHelper.getSimpleDistance(token1, token2, wallsBlock);
    }
  }

  /**
   * Returns the highest ability of an actor based on the given abilities.
   *
   * @param {object} actor The actor object.
   * @param {Array|string} abilities The abilities array or string.
   * @returns {string|undefined} The highest ability or undefined if no abilities are provided.
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
   * @param {object} entity The entity for which to retrieve the race or type.
   * @returns {string} The race or type of the entity, in lowercase.
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
   * @param {any} tokenRef The token reference to retrieve the token from.
   * @returns {Token|undefined} The retrieved token if it exists, otherwise undefined.
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
   * @param {any} tokenRef The token reference to retrieve the TokenDocument for.
   * @returns {TokenDocument|undefined} The TokenDocument associated with the token reference, or undefined if not found.
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
   * @param {Actor} actor The actor for which to retrieve the token.
   * @returns {Token|undefined} The token associated with the actor, or undefined if no token is found.
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
   * @param {object} token The token for which to get the image.
   * @returns {string} The image URL for the token.
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
   * @param {any} entity The entity to retrieve the type or race from.
   * @returns {string} The type or race of the entity, in lowercase. If the type or race is not available, an empty string is returned.
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
   * @returns {number} a new duration which reflects the remaining duration of the specified one.
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

  static isAttack({
    activity, classification = null, type = null, orHasProperties = [], andHasProperties = [],
  } = {}) {
    if (activity.type !== "attack") return false;
    if (classification && activity.attack?.type?.classification !== classification) return false;
    if (andHasProperties.length > 0 && !andHasProperties.every((p) => activity.parent.properties.has(p))) return false;
    const orHas = orHasProperties.some((p) => activity.parent.properties.has(p));
    if ((type && activity.attack?.type?.value !== type)
      || (orHas.length > 0 && !orHas)) return false;

    return true;
  }

  /**
   * Returns true if the attack is a ranged weapon attack. It also supports melee weapons
   * with the thrown property.
   * @param {object} params
   * @param {Activity} params.activity used
   * @param {Token} params.sourceToken
   * @param {Token} params.targetToken
   * @returns {boolean} true if the attack is a ranged weapon attack that hit
   */
  static isRangedWeaponAttack({ activity, sourceToken, targetToken } = {}) {
    if (!DDBEffectHelper.isAttack({
      activity,
      type: "ranged",
      orHasProperties: ["thr"],
      classification: "weapon",
    })) return false;

    const distance = DDBEffectHelper.getDistance(sourceToken, targetToken, true);
    const meleeDistance = 5; // Would it be possible to have creatures with reach and thrown weapon?
    return distance >= 0 && distance > meleeDistance;
  }

  /**
   * Returns true if the attack is a melee weapon attack.
   * @param {object} params
   * @param {Activity} params.activity used
   * @returns {boolean} true if the attack is a ranged weapon attack that hit
   */
  static isMeleeWeaponAttack({ activity } = {}) {
    if (!DDBEffectHelper.isAttack({
      activity,
      type: "melee",
      classification: "weapon",
    })) return false;

    return true;
  }

  /**
   * Check if actor a is smaller than b based on their sizes.
   *
   * @param {type} a
   * @param {type} b
   * @returns {boolean} true if a is smaller than b, false otherwise
   */
  static isSmaller (a, b) {
    const sizeA = DICTIONARY.sizes.find((s) => s.value === a.system.traits.size)?.size;
    const sizeB = DICTIONARY.sizes.find((s) => s.value === b.system.traits.size)?.size;
    return sizeA < sizeB;
  }

  /**
   * Gets actor size value.
   * @param {Actor5e} actor actor for which to get the size value.
   * @returns {number} the numeric value of the specified actor's size.
   */
  static getActorSizeValue(actor) {
    return DDBEffectHelper.getSizeValue(actor?.system?.traits?.size ?? "med");
  }

  /**
   * Returns the numeric value of the specified size.
   *
   * @param {string} size  the size name for which to get the size value.
   * @returns {number} the numeric value of the specified size.
   */
  static getSizeValue(size) {
    return Object.keys(CONFIG.DND5E.actorSizes).indexOf(size ?? "med");
  }


  /**
   * Checks if all specified module dependencies are installed and active.
   *
   * @param {string} name The name of the feature or module that has dependencies.
   * @param {Array<string>} dependencies An array of module names to check for installation and activation.
   * @returns {boolean} true if all dependencies are installed and active, false otherwise.
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
   * @param {object} item The item for which the saving throw is rolled
   * @param {object} targetToken The token representing the target of the saving throw
   * @param {object} [workflow=null] The workflow for which the saving throw is rolled
   * @returns {Promise} A promise that resolves with the save result
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
   * @returns {Array[Token]} an array of Token instances that were selected.
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

    actor = (actor.document ?? actor);
    const condition = CONFIG.statusEffects.find((se) => se.name.toLowerCase() === conditionName.toLowerCase());

    if (!condition) {
      logger.error(`Condition ${conditionName} not found`);
      return;
    }

    logger.debug(`Removing ${condition.name}`, { condition });
    const existing = (condition._id
      ? actor.effects?.get(condition._id)
      : null)
      ?? actor.effects?.get(game.dnd5e.utils.staticID(`dnd5e${condition.id}`));
    logger.debug("Existing condition found", { condition, existing });
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
    configureDialog = false, targetConfirmation = undefined, slotLevel = false,
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
        slotLevel,
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

  static getConcentrationNames(rolledDocumentName = "") {
    return Array.from(new Set([
      `${game.i18n.localize("midi-qol.Concentrating")}: ${rolledDocumentName}`,
      game.i18n.localize("midi-qol.Concentrating"),
      `Concentrating: ${rolledDocumentName}`,
      `Concentrating`,
    ]));
  }

  static getConcentrationEffect(actor, documentName = "") {
    const concentrationEffectNames = DDBEffectHelper.getConcentrationNames(documentName);
    return actor.effects.find((ef) => concentrationEffectNames.some((c) => ef.name.startsWith(c)));
  }

  static overTimeDamage({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc } = {}) {
    return ChangeHelper.overTimeDamageChange({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc });
  }

  static overTimeSave({ document, turn, saveAbility, saveRemove = true, dc } = {}) {
    return ChangeHelper.overTimeSaveChange({ document, turn, saveAbility, saveRemove, dc });
  }

  static startOrEnd(text) {
    return DDBDescriptions.startOrEnd(text);
  }

  static overTimeSaveEnd({ document, effect, save, text }) {
    const change = MidiOverTimeEffect.getOverTimeSaveEndChange({ document, save, text });
    if (change) effect.changes.push(change);
  }


  static getSpecialDuration(effect, match) {
    return DDBDescriptions.addSpecialDurationFlagsToEffect(effect, match);
  }


  static DEFAULT_DURATION_SECONDS = 60;

  static getDuration(text, returnDefault = true) {
    return DDBDescriptions.getDuration(text, returnDefault);
  }

  static dcParser({ text } = {}) {
    return DDBDescriptions.dcParser({ text });
  }

  static parseStatusCondition({ text, nameHint = null } = {}) {
    return DDBDescriptions.parseStatusCondition({ text, nameHint });
  }

  static documentWithFilteredActivities({
    uuid = null, document = null, parent = null, activityIds = [], activityTypes = [], clearEffectFlags = false,
    clearEffects = false, filterEffects = true, newId = false, clearId = true, removeProperties = ["concentration"],
    setToAtWill = false, renameDocument = null, setTargetTo = "creature", clearTargetTemplate = true,
    overrideTarget = true, overrideDuration = true, durationUnits = "inst", durationValue = null,
    level = null, clearUses = true, addProperties = [],
  } = {}) {
    if (!uuid && !document) throw new Error("Must specify either uuid or document !");
    const base = document ?? fromUuidSync(uuid);
    if (!base) return null;
    const newDocumentData = document.toObject();
    if (clearId) delete newDocumentData._id;
    if (newId) newDocumentData._id = foundry.utils.randomID();
    if (activityIds.length > 0)
      newDocumentData.system.activities = newDocumentData.system.activities.filter((a) => activityIds.includes(a._id));
    if (activityTypes.length > 0)
      newDocumentData.system.activities = newDocumentData.system.activities.filter((a) => activityTypes.includes(a.type));

    newDocumentData.system.activities = newDocumentData.system.activities.map((a) => {
      if (a.consumption) a.consumption.targets = [];
      if (overrideTarget) a.target.override = true;
      if (setTargetTo) {
        foundry.utils.setProperty(a, "target.affects.type", {
          count: "1",
          type: setTargetTo,
          choice: false,
          special: "",
        });
      }
      if (clearTargetTemplate) {
        foundry.utils.setProperty(a, "target.template", {
          count: "",
          contiguous: false,
          type: "",
          size: "",
          width: "",
          height: "",
          units: "ft",
        });
      }
      if (overrideDuration) a.duration.override = true;
      if (durationUnits) {
        a.duration.units = durationUnits;
        a.duration.value = durationValue;
      }
      return a;
    });
    if (clearEffectFlags) {
      foundry.utils.setProperty(newDocumentData, "flags.itemacro", {});
      foundry.utils.setProperty(newDocumentData, "flags.midi-qol", {});
      foundry.utils.setProperty(newDocumentData, "flags.midiProperties", {});
      foundry.utils.setProperty(newDocumentData, "flags.dae", {});
    }
    if (filterEffects) {
      const allowedIds = Object.values(newDocumentData.system.activities).map((a) => {
        return (a.effects ?? []).map((e) => e._id);
      }).flat();
      newDocumentData.effects = newDocumentData.effects.filter((e) => allowedIds.includes(e._id));
    } else if (clearEffects) {
      foundry.utils.setProperty(newDocumentData, "effects", []);
    }
    for (const prop of removeProperties) {
      newDocumentData.system.properties = utils.removeFromProperties(newDocumentData.system.properties, prop);
    }
    for (const prop of addProperties) {
      newDocumentData.system.properties = utils.addToProperties(newDocumentData.system.properties, prop);
    }
    if (setToAtWill) {
      foundry.utils.setProperty(newDocumentData, "system.preparation.mode", "atwill");
    }
    if (renameDocument) {
      newDocumentData.name = renameDocument;
    }
    if (clearUses) {
      foundry.utils.setProperty(newDocumentData, "system.uses", {
        spent: null,
        max: null,
        recovery: [],
      });
    }

    if (level) newDocumentData.system.level = level;

    const newDocument = new CONFIG.Item.documentClass(newDocumentData, { parent });
    return newDocument;
  }

  static async rollMidiItemUse(document, workflowBuilderOptions = {}, {
    targetIds = [], applyFailureConditions = [],
  } = {}) {
    const saveTargets = game.user?.targets
      ? [...game.user.targets].map((t) => t.id)
      : [];
    if (targetIds.length > 0) game.user.updateTokenTargets(targetIds);

    const [config, options] = DDBEffectHelper.syntheticItemWorkflowOptions(workflowBuilderOptions);
    const result = await MidiQOL.completeItemUse(document, config, options);

    if (targetIds.length > 0) game.user.updateTokenTargets(saveTargets);

    const conditionResults = [];
    if (applyFailureConditions.length > 0) {
      for (const failedSave of result.failedSaves) {
        for (const condition of applyFailureConditions) {
          conditionResults.push(DDBEffectHelper.adjustCondition({
            add: true,
            conditionName: condition,
            actor: failedSave.document,
          }));
        }
      }
    }
    await Promise.all(conditionResults);

  }


  // eslint-disable-next-line complexity
  static async _conditionRemovalMidiRoll(targetToken, condition, {
    document = {},
    activity = null,
    type = null, // can be save or check, if null, will check flags
    ability = null, // e.g. wis, if null, will check flags
    saveDC = null, // if null, will use activity if present, otherwise spelldc
  } = {}) {
    const name = document?.name ?? "";
    const caster = document.parent;
    const derivedActivity = activity
      ?? Object.values(foundry.utils.getProperty(document, "system.activities") ?? {}).find((a) => a.type === "save");
    const derivedSaveDc = saveDC ?? derivedActivity?.save?.dc?.value ?? caster?.system.attributes.spelldc;
    if (!derivedSaveDc) throw new Error("No save DC specified, and no default spelldc found on document parent actor!");
    const removalCheck = foundry.utils.getProperty(document, "flags.ddbimporter.effect.removalCheck");
    const removalSave = foundry.utils.getProperty(document, "flags.ddbimporter.effect.removalSave");
    const derivedAbility = ability ?? (removalCheck ? removalCheck : removalSave) ?? derivedActivity?.save?.ability.first();
    if (!derivedAbility) throw new Error("No ability specified, and no default removal ability found in document flags!");
    const derivedType = type ?? (removalCheck ? "check" : removalSave ? "save" : null);
    if (!derivedType) throw new Error("No type specified, and no default removal type found in document flags!");
    const viaNameStub = name ? ` (via ${name})` : "";
    const flavor = `${condition}${viaNameStub} : ${CONFIG.DND5E.abilities[derivedAbility].label} ${derivedType} vs DC${derivedSaveDc}`;
    const speaker = ChatMessage.getSpeaker({
      targetActor: targetToken.actor,
      scene: canvas.scene,
      token: targetToken?.document ?? targetToken,
    });

    const rollResult = derivedType === "check"
      ? (await targetToken.actor.rollAbilityTest(derivedAbility, { speaker, flavor })).total
      : (await targetToken.actor.rollSavingThrow({
        ability: derivedAbility,
        target: derivedSaveDc,
      }, {}, { data: { speaker, flavor } }))[0].total;

    if (rollResult >= derivedSaveDc) {
      await DDBEffectHelper.adjustCondition({ remove: true, conditionName: condition, actor: targetToken.actor });
    } else if (rollResult < derivedSaveDc) {
      const nameStub = name ? ` for ${name}` : "";
      ChatMessage.create({
        content: `${targetToken.name} fails the ${derivedType}${nameStub}, and still has the ${condition} condition.`,
      });
    }
    return rollResult;
  }

  static async attemptConditionRemovalDialog(targetToken, condition, {
    document = {},
    activity = null,
    type = null, // can be save or check, if null, will check flags
    ability = null, // e.g. wis, if null, will check flags
    saveDC = null, // if null, will use activity if present, otherwise spelldc
    ask = true,
    checkConditionExists = true,
  } = {}) {
    if (!DDBEffectHelper.isConditionEffectAppliedAndActive(condition, targetToken.actor)
      && checkConditionExists)
      return;

    if (ask) {
      new Dialog({
        title: `Use action to attempt to remove ${condition}?`,
        buttons: {
          one: {
            label: "Yes",
            callback: async () => {
              DDBEffectHelper._conditionRemovalMidiRoll(targetToken, condition, {
                document,
                activity,
                type,
                ability,
                saveDC,
              });
            },
          },
          two: {
            label: "No",
            callback: () => {
              ChatMessage.create({
                content: `${targetToken.name} retains the ${condition} condition.`,
              });
            },
          },
        },
      }).render(true);
    } else {
      DDBEffectHelper._conditionRemovalMidiRoll(targetToken, condition, {
        document,
        activity,
        type,
        ability,
        saveDC,
      });
    }
  }

}
