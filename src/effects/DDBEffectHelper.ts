import {
  utils,
  logger,
  DialogHelper,
  FolderHelper,
} from "../lib/_module";
import { DICTIONARY } from "../config/_module";
import DDBMonsterFeature from "../parser/monster/features/DDBMonsterFeature";
import DDBDescriptions from "../parser/lib/DDBDescriptions";
import AutoEffects from "../parser/enrichers/effects/AutoEffects";
import ChangeHelper from "../parser/enrichers/effects/ChangeHelper";
import MidiOverTimeEffect from "../parser/enrichers/effects/MidiOverTimeEffect";

// numbered title/content chunks pulled out of ol/p HTML lists
// (used for monster ray/option style features)
interface IExtractedHtmlItem {
  number: number;
  title: string;
  content: string;
  full: string;
}

interface IDamageOverTimeEffectOptions {
  document: I5ePCItem | I5eMonsterItem;
  startTurn?: boolean;
  endTurn?: boolean;
  durationSeconds?: number;
  damage?: string;
  damageType?: string;
  saveAbility?: string | string[];
  saveRemove?: boolean;
  saveDamage?: string;
  dc?: number | string;
}

type THookCallback = (...args: never[]) => unknown;

// Loosely typed view of the Hooks helper for third-party/dynamic hook names
// that are not registered in the HookConfig interface.
interface IDynamicHooks {
  on(hook: string, fn: THookCallback, options?: { once?: boolean }): number;
  once(hook: string, fn: THookCallback): number;
  off(hook: string, fn: number | THookCallback): void;
  call(hook: string, ...args: unknown[]): boolean;
  callAll(hook: string, ...args: unknown[]): boolean;
}

interface IAAWorkflowData {
  item?: { name?: string; origin?: string };
  recheckAnimation?: boolean;
}

interface ITokenTargetUser {
  updateTokenTargets(targetIds?: string[]): void;
  broadcastActivity(activityData?: Record<string, unknown>): void;
}

type TRaceDetail = string & { name?: string };

interface IDetailsSystemStub {
  details: {
    race?: TRaceDetail;
    type?: { value?: string };
  };
}

interface ILevelCrSystemStub {
  details: {
    level: number;
    cr: number;
  };
}

interface IAbilitiesSystemStub {
  abilities: Record<string, { value: number }>;
}

interface IAttackStubActivity {
  type?: string;
  attack?: { type?: { classification?: string; value?: string } };
  parent?: { properties?: Set<string> };
}

interface IRemovalActivity {
  type?: string;
  save?: { dc?: { value?: number }; ability?: { first(): string } };
}

export default class DDBEffectHelper {

  static get baseEffect() {
    return AutoEffects.BaseEffect;
  }

  static get generateDAEStatusEffectChange() {
    return ChangeHelper.daeStatusEffectChange;
  }

  static get addStatusEffectChange() {
    return ChangeHelper.addStatusEffectChange;
  }

  static get generateTokenMagicFXChange() {
    return ChangeHelper.tokenMagicFXChange;
  }

  static get generateATLChange() {
    return ChangeHelper.atlChange;
  }

  static getMonsterFeatureDamage(damageText: string, featureDoc: TAll5eItemDocuments | null = null): IDDBMonsterActionDataDamagePart[] {
    const preParsed = featureDoc
      ? foundry.utils.getProperty(featureDoc, "flags.monsterMunch.actionData.damageParts") as IDDBMonsterActionDataDamagePart[] | undefined
      : undefined;
    if (preParsed && preParsed.length > 0) return preParsed;
    logger.debug("Monster feature damage miss", { damageText, featureDoc });
    // DDBMonsterFeature requires a ddbMonster; this fallback has never had one,
    // so it always threw. Degrade to no damage parts instead of crashing mid-macro.
    try {
      const feature = new DDBMonsterFeature("overTimeFeature", { html: damageText });
      feature.prepare();
      feature.generateDamageInfo();
      return feature.actionData.damageParts;
    } catch (err) {
      logger.warn("Unable to parse monster feature damage without a monster context", { damageText, err });
      return [];
    }
  }

  static getOvertimeDamage(text: string, featureDoc: TAll5eItemDocuments | null = null): IDDBMonsterActionDataDamagePart[] | undefined {
    if (text.includes("taking") && (text.includes("on a failed save") || text.includes("damage on a failure"))) {
      const damageText = text.split("taking")[1];
      return DDBEffectHelper.getMonsterFeatureDamage(damageText, featureDoc);
    }
    return undefined;
  }


  static generateConditionOnlyEffect(actor: I5eActorData, document: TAll5eItemDocuments, otherDescription: string | null = null) {
    const generator = new MidiOverTimeEffect({
      document,
      actor,
      otherDescription,
    });
    generator.generateConditionOnlyEffect();
  }


  static generateOverTimeEffect(actor: I5eActorData, document: TAll5eItemDocuments, otherDescription: string | null = null) {
    const generator = new MidiOverTimeEffect({
      document,
      actor,
      otherDescription,
    });
    generator.generateOverTimeEffect();

  }

  static damageOverTimeEffect({ document, startTurn = false, endTurn = false, durationSeconds, damage,
    damageType, saveAbility, saveRemove = true, saveDamage = "nodamage", dc }: IDamageOverTimeEffectOptions,
  ) {
    const generator = new MidiOverTimeEffect({
      document,
      // generateDamageOverTimeEffect never dereferences actor; the options type
      // requires one but this call path has no actor to give
      actor: null as unknown as I5eActorData,
      otherDescription: null,
    });
    return generator.generateDamageOverTimeEffect({
      startTurn,
      endTurn,
      durationSeconds,
      damage,
      damageType,
      saveAbility,
      saveRemove,
      saveDamage,
      dc,
    });
  }


  static addToProperties(properties: string[], value: string): string[] {
    return utils.addToProperties(properties, value);
  }

  static removeFromProperties(properties: string[], value: string): string[] {
    return utils.removeFromProperties(properties, value);
  }

  static async wait(ms: number) {
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
  static async addSaveAdvantageToTarget(targetActor: Actor.Known, originItem: Item.Known, ability: T5eAbility, additionLabel = "", icon: string | null = null) {

    const effectData: I5eEffectData = {
      _id: foundry.utils.randomID(),
      system: {
        changes: [
          {
            key: `system.abilities.${ability}.advantage.roll.mode`,
            type: "custom",
            value: `${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`,
            priority: 20,
          },
        ],
      },
      origin: originItem.uuid ?? undefined,
      disabled: false,
      transfer: false,
      img: icon ?? undefined,
      duration: { value: 1, units: "turns" },
      flags: {
        dae: {
          specialDuration: [`isSave.${ability}` as any],
        },
      },
    };
    effectData.name = `${originItem.name}${additionLabel}: Save Advantage`;
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [effectData] });
  }

  static async attachSequencerFileToTemplate(templateUuid: string, sequencerFile: string, originUuid: string, scale = 1) {
    if (game.modules.get("sequencer")?.active) {
      if (Sequencer.Database.entryExists(sequencerFile)) {
        logger.debug(`Trying to apply sequencer effect (${sequencerFile}) to ${templateUuid} from ${originUuid}`, sequencerFile);
        const grid = canvas.grid;
        const dimensions = canvas.dimensions;
        if (!grid || !dimensions) {
          logger.warn("attachSequencerFileToTemplate: canvas is not ready, skipping sequencer effect");
          return;
        }
        const template = await fromUuid(templateUuid) as unknown as { width: number };
        new Sequence()
          .effect()
          .file(Sequencer.Database.entryExists(sequencerFile))
          .size({
            width: grid.size * (template.width / dimensions.distance),
            height: grid.size * (template.width / dimensions.distance),
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

  static async buttonDialog(config: IDDBDialogHelperButtonDialogConfig, direction: string) {
    return DialogHelper.buttonDialog(config, direction);
  }

  static canSense(token: foundry.canvas.placeables.Token, target: foundry.canvas.placeables.Token): boolean {
    return MidiQOL.canSense(token, target);
  }

  static checkCollision(
    ray: foundry.canvas.geometry.Ray,
    types: CONST.WALL_RESTRICTION_TYPES[] = ["sight", "move"],
    mode: foundry.canvas.geometry.PointSourcePolygon.CollisionModes = "any",
  ) {
    for (const type of types) {
      const result = CONFIG.Canvas.polygonBackends[type].testCollision(ray.A, ray.B, { mode, type });
      if (result) return result;
    }
    return false;
  }

  /**
   * Checks the cover bonus for a given token, target, item, and displayName.
   *
   * @param {foundry.canvas.placeables.Token} token The token object.
   * @param {foundry.canvas.placeables.Token} target The target object.
   * @param {Item} item The item object.
   * @param {string} displayName The display name of the cover.
   * @returns {string|number} The cover bonus or the display name of the cover.
   */
  static checkCover(token: foundry.canvas.placeables.Token, target: foundry.canvas.placeables.Token, item: Item, displayName: string) {
    const cover = MidiQOL.computeCoverBonus(token, target, item) as number;
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
  static configureCustomAAForCondition(condition: string, macroData: any, originItemName: string, conditionItemUuid: string) {
    // Get default condition label
    const statusName = CONFIG.DND5E.conditionTypes[condition];
    if (!statusName) {
      return;
    }
    const customStatusName = `${statusName.label} [${originItemName}]`;
    if (AutomatedAnimations.AutorecManager.getAutorecEntries().aefx.find((a: any) => (a.label ?? a.name) === customStatusName)) {
      const aaHookId = (Hooks as unknown as IDynamicHooks).on("AutomatedAnimations-WorkflowStart", (data: IAAWorkflowData) => {
        if (
          data.item instanceof CONFIG.ActiveEffect.documentClass
          && data.item.name === statusName.label
          && data.item.origin === macroData.sourceItemUuid
        ) {
          data.recheckAnimation = true;
          (data.item as { name: string }).name = customStatusName;
          (Hooks as unknown as IDynamicHooks).off("AutomatedAnimations-WorkflowStart", aaHookId);
        }
      });
      // Make sure that the hook is removed when the special spell effect is completed
      (Hooks as unknown as IDynamicHooks).once(`midi-qol.RollComplete.${conditionItemUuid}`, () => {
        (Hooks as unknown as IDynamicHooks).off("AutomatedAnimations-WorkflowStart", aaHookId);
      });
    }
  }

  static checkJB2a(free = true, patreon = true, notify = false) {
    if (patreon && game.modules.get("jb2a_patreon")?.active) {
      return true;
    } else if (!free) {
      if (notify) ui.notifications.error("This macro requires the patreon version of JB2A");
      return false;
    }
    if (free && game.modules.get("JB2A_DnD5e")?.active) return true;
    if (notify) ui.notifications.error("This macro requires either the patreon or free version of JB2A");
    return false;
  }

  static async _createJB2aActors(subFolderName: string, name: string) {
    const packKeys = ["jb2a_patreon.jb2a-actors", "JB2A_DnD5e.jb2a-actors"];
    for (const key of packKeys) {
      const pack = game.packs.get(key) as CompendiumCollection<"Actor"> | undefined;

      if (!pack) continue;
      const actors = pack.index.filter((f) => (f.name as string).includes(name)) as TIndexEntry[];
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

  static async checkTargetInRange({ sourceUuid, targetUuid, distance }: { sourceUuid: string; targetUuid: string; distance: number }) {
    if (!game.modules.get("midi-qol")?.active) {
      ui.notifications.error("checkTargetInRange requires midiQoL, not checking");
      logger.error("checkTargetInRange requires midiQoL, not checking");
      return true;
    }
    const sourceToken = await fromUuid(sourceUuid) as unknown as foundry.canvas.placeables.Token;
    if (!sourceToken) return false;
    const targetsInRange = MidiQOL.findNearby(null, sourceUuid, distance);
    const isInRange = targetsInRange.reduce((result: boolean, possible: any) => {
      const collisionRay = new foundry.canvas.geometry.Ray(sourceToken as unknown as { x: number; y: number }, possible);
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
  static async displayItemCard(item: Item.Known) {
    const msg = await item.displayCard({ create: false });
    const DIV = document.createElement("DIV");
    DIV.innerHTML = msg.content;
    DIV.querySelector("div.card-buttons")?.remove();
    await ChatMessage.create({ content: DIV.innerHTML } as unknown as ChatMessage.CreateInput);
  }

  /**
   * Identifies and returns the IDs of tokens that are contained within a given template.
   *
   * @param {MeasuredTemplateDocument} templateDoc The template document used to determine token containment.
   * @returns {Array} An array of token IDs that are contained within the specified template.
   */
  static findContainedTokensInTemplate(templateDoc: MeasuredTemplateDocument) {
    // TODO: this needs refactoring for v14
    const contained = new Set();
    const scene = templateDoc.parent;
    const shape = templateDoc.object?.shape;
    if (!scene || !shape) {
      logger.warn("findContainedTokensInTemplate: template has no scene or rendered shape", { templateDoc });
      return [];
    }
    for (const tokenDoc of scene.tokens) {
      const startX = tokenDoc.width >= 1 ? 0.5 : tokenDoc.width / 2;
      const startY = tokenDoc.height >= 1 ? 0.5 : tokenDoc.height / 2;
      for (let x = startX; x < tokenDoc.width; x++) {
        for (let y = startY; y < tokenDoc.width; y++) {
          const curr = {
            x: tokenDoc.x + (x * scene.grid.size) - templateDoc.x,
            y: tokenDoc.y + (y * scene.grid.size) - templateDoc.y,
          };
          const contains = shape.contains(curr.x, curr.y);
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
  static findEffect(actor: Actor.Known, name: string) {
    return actor.effects.getName(name);
  }

  static getActorEffects(actor: Actor.Known | Actor.Implementation | TImporterActor) {
    return Array.from(actor?.allApplicableEffects() ?? []);
  }

  /**
   * Asynchronously gets a new target and updates workflow data.
   *
   * @param {object} workflow The workflow object to update
   * @param {object} item The item to get the new target for
   * @param {foundry.canvas.placeables.Token} oldToken The old token to remove from the workflow targets
   * @param {string} [targetTitle] An optional title to display in the target confirmation dialog
   *
   * @returns {foundry.canvas.placeables.Token|undefined} The new target, or undefined if no new target is found
   */
  static async getNewMidiQOLWorkflowTarget(workflow: any, item: any, oldToken: foundry.canvas.placeables.Token, targetTitle: string | undefined = undefined) {
    workflow.targets.delete(oldToken);
    workflow.saves.delete(oldToken);
    workflow.hitTargets.delete(oldToken);
    await DDBEffectHelper.displayItemCard(item);
    await MidiQOL.resolveTargetConfirmation(item, { forceDisplay: true, title: targetTitle });

    const newToken = game.user.targets.first();
    if (!newToken) return undefined;
    workflow.targets.add(newToken);
    workflow.hitTargets.add(newToken);
    workflow.saveResults = workflow.saveResults.filter((e: any) => e.data.tokenId !== oldToken.id);
    return newToken;
  }

  /**
   * Finds effects for the given actor and names.
   *
   * @param {Actor} actor The actor to find effects for.
   * @param {string[]} names An array of effect names to search for.
   * @returns {object[]} An array of effects matching the given names.
   */
  static findEffects(actor: Actor.Known, names: string[]) {
    const results: any[] = [];
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
   * @returns {Actor|null} Returns the actor document or null if not found.
   */
  static fromActorUuid(uuid: string): Actor.Known | Actor | Actor.Implementation | null {
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
  static getActor(actorRef: string | Actor.Known | foundry.canvas.placeables.Token | TokenDocument): Actor | Actor.Implementation | null {
    if (actorRef instanceof Actor) return actorRef;
    if (actorRef instanceof foundry.canvas.placeables.Token) return actorRef.actor;
    if (actorRef instanceof TokenDocument) return actorRef.actor;
    if (utils.isString(actorRef)) return DDBEffectHelper.fromActorUuid(actorRef as string);
    return null;
  }

  /**
   * Retrieves the number of cantrip dice based on the level of the actor.
   *
   * @param {Actor} actor The actor object
   * @returns {number} The number of cantrip dice.
   */
  static getCantripDice(actor: Actor): number {
    const systemData = actor.system as unknown as ILevelCrSystemStub;
    const level: number = actor.type === "character"
      ? systemData.details.level
      : systemData.details.cr;
    return 1 + Math.floor((level + 1) / 6);
  }

  /**
   * Get the distance segments between two objects.
   *
   * @param {object} t1 the first token
   * @param {object} t2 the second token
   * @param {boolean} wallBlocking whether to consider walls as blocking
   * @returns {Array} an array of segments representing the distance between the two objects
   */
  static _getDistanceSegments(t1: any, t2: any, wallBlocking = false): { origin: Canvas.Point; dest: Canvas.Point }[] {
    const t1StartX = t1.document.width >= 1 ? 0.5 : t1.document.width / 2;
    const t1StartY = t1.document.height >= 1 ? 0.5 : t1.document.height / 2;
    const t2StartX = t2.document.width >= 1 ? 0.5 : t2.document.width / 2;
    const t2StartY = t2.document.height >= 1 ? 0.5 : t2.document.height / 2;
    let x, x1, y, y1;
    const segments: { origin: Canvas.Point; dest: Canvas.Point }[] = [];
    const grid = canvas.grid;
    const dimensions = canvas.dimensions;
    if (!grid || !dimensions) {
      logger.warn("_getDistanceSegments: canvas is not ready");
      return segments;
    }
    for (x = t1StartX; x < t1.document.width; x++) {
      for (y = t1StartY; y < t1.document.height; y++) {
        const origin = grid.getCenterPoint({
          x: Math.round(t1.document.x + (dimensions.size * x)),
          y: Math.round(t1.document.y + (dimensions.size * y)),
        });
        for (x1 = t2StartX; x1 < t2.document.width; x1++) {
          for (y1 = t2StartY; y1 < t2.document.height; y1++) {
            const dest = grid.getCenterPoint({
              x: Math.round(t2.document.x + (dimensions.size * x1)),
              y: Math.round(t2.document.y + (dimensions.size * y1)),
            });

            if (wallBlocking) {
              const collisionCheck = CONFIG.Canvas.polygonBackends.move.testCollision(origin, dest, { mode: "any", type: "move" });

              if (collisionCheck) continue;
            }
            segments.push({ origin, dest });
          }
        }
      }
    }
    return segments;
  }

  /**
   * Calculate the height difference between two tokens based on their elevation and dimensions.
   *
   * @param {Token} t1 the first token
   * @param {Token} t2 the second token
   * @returns {number} the height difference between the two tokens
   */
  static _calculateTokenHeightDifference(t1: Token, t2: Token) {
    const t1Elevation = t1.document.elevation ?? 0;
    const t2Elevation = t2.document.elevation ?? 0;
    const t1TopElevation = t1Elevation + (Math.max(t1.document.height, t1.document.width) * (canvas?.dimensions?.distance ?? 5));
    const t2TopElevation = t2Elevation + (Math.min(t2.document.height, t2.document.width) * (canvas?.dimensions?.distance ?? 5));

    let heightDifference = 0;
    const t1ElevationRange = Math.max(t1.document.height, t1.document.width) * (canvas?.dimensions?.distance ?? 5);
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
   * @param {string | Token} token1 The ID or instance of the first token
   * @param {string | Token} token2 The ID or instance of the second token
   * @param {boolean} wallBlocking Whether to consider walls as obstacles (default is false)
   * @returns {number} The calculated distance between the two tokens
   */
  static getSimpleDistance(token1:  string | Token, token2:  string | Token, wallBlocking = false): number {
    if (!canvas || !canvas.scene) return -1;
    if (!canvas.grid || !canvas.dimensions) return -1;
    const t1 = DDBEffectHelper.getToken(token1);
    const t2 = DDBEffectHelper.getToken(token2);
    if (!t1 || !t2) return -1;
    if (!canvas || !canvas.grid || !canvas.dimensions) return -1;
    const grid = canvas.grid;

    const segments = DDBEffectHelper._getDistanceSegments(t1, t2, wallBlocking);
    if (segments.length === 0) return -1;

    const heightDifference = DDBEffectHelper._calculateTokenHeightDifference(t1, t2);

    // measurePath applies the scene's configured diagonal rule (CONST.GRID_DIAGONALS) in 3D
    const distances = segments.map(({ origin, dest }) =>
      grid.measurePath([
        { x: origin.x, y: origin.y, elevation: 0 },
        { x: dest.x, y: dest.y, elevation: heightDifference },
      ], {}).distance,
    );

    return Math.min(...distances);
  }

  static getDistance(token1: string | Token, token2:  string | Token, wallsBlock = false, includeCover = false) {
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
  static getHighestAbility(actor: Actor.Implementation, abilities: T5eAbility[] | T5eAbility): T5eAbility | undefined {
    if (typeof abilities === "string") {
      return abilities;
    } else if (Array.isArray(abilities)) {
      const systemData = actor.system as unknown as IAbilitiesSystemStub;
      return abilities.reduce((prv, current) => {
        if (systemData.abilities[current].value > systemData.abilities[prv].value) return current;
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
  static getRaceOrType(entity: string | Actor.Known | foundry.canvas.placeables.Token | TokenDocument): string {
    const actor = DDBEffectHelper.getActor(entity);
    const systemData = actor?.system as unknown as IDetailsSystemStub;
    if (!systemData) return "";
    if (systemData.details.race) {
      return (systemData.details?.race?.name ?? systemData.details?.race)?.toLocaleLowerCase() ?? "";
    }
    return systemData.details.type?.value?.toLocaleLowerCase() ?? "";
  }

  /**
   * Retrieves the token based on the provided token reference.
   *
   * @param {any} tokenRef The token reference to retrieve the token from.
   * @returns {Token|undefined} The retrieved token if it exists, otherwise undefined.
   */
  static getToken(tokenRef: string | foundry.canvas.placeables.Token | TokenDocument) {
    if (!tokenRef) return undefined;
    if (tokenRef instanceof foundry.canvas.placeables.Token) return tokenRef;
    if (utils.isString(tokenRef)) return ((fromUuidSync(tokenRef) as unknown as TokenDocument)?.object);
    if (tokenRef instanceof TokenDocument) return tokenRef.object;
    return undefined;
  }

  /**
   * Retrieves the TokenDocument associated with the given token reference.
   *
   * @param {any} tokenRef The token reference to retrieve the TokenDocument for.
   * @returns {TokenDocument|undefined} The TokenDocument associated with the token reference, or undefined if not found.
   */
  static getTokenDocument(tokenRef: string | foundry.canvas.placeables.Token | TokenDocument): TokenDocument | undefined {
    if (!tokenRef) return undefined;
    if (tokenRef instanceof TokenDocument) return tokenRef;
    if (typeof tokenRef === "string") {
      const document = fromUuidSync(tokenRef) as TokenDocument | Actor.Known | undefined;
      if (document instanceof TokenDocument) return document;
      if (document instanceof Actor) return DDBEffectHelper.getTokenForActor(document)?.document;
    }
    if (tokenRef instanceof foundry.canvas.placeables.Token) return tokenRef.document;
    return undefined;
  }

  /**
   * Returns a token for the provided actor.
   *
   * @param {Actor} actor The actor for which to retrieve the token.
   * @returns {Token|undefined} The token associated with the actor, or undefined if no token is found.
   */
  static getTokenForActor(actor: Actor.Known): Token | undefined {
    const tokens = actor.getActiveTokens();
    if (!tokens.length) return undefined;
    const controlled = tokens.filter((t) => t.controlled);
    return controlled.length ? controlled.shift() : tokens.shift();
  }

  static getActiveCreaturesFromTokenByDisposition(target: Token, {
    includeIncapacitated = false,
    excludedActorIds = [] as string[], excludedTokenIds = [] as string[], distance = 5,
  } = {}) {

    const result: {
      allies: Token[];
      enemies: Token[];
      neutrals: Token[];
      others: Token[];
    } = {
      allies: [],
      enemies: [],
      neutrals: [],
      others: [],
    };
    if (!target) return result;
    canvas.tokens.placeables.forEach((t) => {
      const nearby = t.actor
        && !excludedActorIds.includes(t.actor?.id ?? "") // typically the origin actor
        && !excludedTokenIds.includes(t.id ?? "") // token ids excluded
        && t.id !== target.id // not the target
        && (includeIncapacitated || ((t.actor as unknown as { system: { attributes?: { hp?: { value?: number } } } })?.system.attributes?.hp?.value ?? 0) > 0) // not incapacitated
        && DDBEffectHelper.getDistance(t, target) <= distance; // close to the target;

      if (nearby) {
        if (t.document.disposition === target.document.disposition) {
          result.allies.push(t);
        } else if (t.document.disposition === -target.document.disposition) {
          result.enemies.push(t);
        } else if (t.document.disposition === 0) {
          result.neutrals.push(t);
        } else {
          result.others.push(t);
        }
      }

    });

    return result;
  }

  /**
   * Get the image for the token.
   *
   * @param {object} token The token for which to get the image.
   * @returns {string} The image URL for the token.
   */
  static async getTokenImage(token: Token) {
    const midiConfigSettings = utils.getSetting<Record<string, any>>("ConfigSettings", "midi-qol");
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
  static getTypeOrRace(entity: any) {
    const actor = DDBEffectHelper.getActor(entity);
    const systemData = actor?.system as unknown as IDetailsSystemStub;
    if (!systemData) return "";
    if (systemData.details.type?.value) {
      return systemData.details.type?.value.toLocaleLowerCase() ?? "";
    }
    return (systemData.details?.race?.name ?? systemData.details?.race)?.toLocaleLowerCase() ?? "";
  }

  static isAttack({
    activity, classification = null, type = null, orHasProperties = [], andHasProperties = [],
  }: {
    activity?: IAttackStubActivity;
    classification?: string | null;
    type?: string | null;
    orHasProperties?: string[];
    andHasProperties?: string[];
  } = {}) {
    if (!activity) return false;
    if (activity.type !== "attack") return false;
    if (classification && activity.attack?.type?.classification !== classification) return false;
    const properties = activity.parent?.properties;
    if (andHasProperties.length > 0 && !andHasProperties.every((p) => properties?.has(p))) return false;
    // orHasProperties is an alternative to the type gate: a thrown melee weapon
    // (attack type "melee" plus the "thr" property) still counts as a ranged attack.
    const typeMatches = !type || activity.attack?.type?.value === type;
    const orMatches = orHasProperties.length > 0 && orHasProperties.some((p) => properties?.has(p));
    if (!typeMatches && !orMatches) return false;

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
  static isRangedWeaponAttack({ activity, sourceToken, targetToken }: {
    activity?: IAttackStubActivity;
    sourceToken?: Token;
    targetToken?: Token;
  } = {}) {
    if (!DDBEffectHelper.isAttack({
      activity,
      type: "ranged",
      orHasProperties: ["thr"],
      classification: "weapon",
    })) return false;

    if (!sourceToken || !targetToken) return false;
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
  static isMeleeWeaponAttack({ activity }: { activity?: IAttackStubActivity } = {}) {
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
  static isSmaller (a: Actor.Implementation, b: Actor.Implementation) {
    const sizeA = DICTIONARY.sizes.find((s) => s.value === (a as any).system.traits.size)?.size;
    const sizeB = DICTIONARY.sizes.find((s) => s.value === (b as any).system.traits.size)?.size;
    // unknown sizes compared as not smaller, matching the previous undefined < undefined behaviour
    if (sizeA === undefined || sizeB === undefined) return false;
    return sizeA < sizeB;
  }

  /**
   * Gets actor size value.
   * @param {Actor.Implementation} actor actor for which to get the size value.
   * @returns {number} the numeric value of the specified actor's size.
   */
  static getActorSizeValue(actor: Actor.Implementation) {
    return DDBEffectHelper.getSizeValue((actor as any)?.system?.traits?.size ?? "med");
  }

  /**
   * Returns the numeric value of the specified size.
   *
   * @param {string} size  the size name for which to get the size value.
   * @returns {number} the numeric value of the specified size.
   */
  static getSizeValue(size: string) {
    return Object.keys(CONFIG.DND5E.actorSizes).indexOf(size ?? "med");
  }


  /**
   * Checks if all specified module dependencies are installed and active.
   *
   * @param {string} name The name of the feature or module that has dependencies.
   * @param {Array<string>} dependencies An array of module names to check for installation and activation.
   * @returns {boolean} true if all dependencies are installed and active, false otherwise.
   */
  static requirementsSatisfied(name: string, dependencies: any) {
    let missingDep = false;
    dependencies.forEach((dep: any) => {
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
  static async rollSaveForItem(item: Item.Implementation, targetToken: Token, workflow: any = null) {
    const { ability, dc } = foundry.utils.duplicate(item.system.save);
    const userID = MidiQOL.playerForActor(targetToken.actor)?.active
      ? MidiQOL.playerForActor(targetToken.actor).id
      : game.users.activeGM?.id;
    if (!userID) {
      logger.warn("rollSaveForItem: no active player or GM found to roll the save", { item, targetToken });
      return undefined;
    }
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
  static selectTargetsWithinX(sourceToken: Token, distance: number, includeSource: boolean) {
    const aoeTargets = MidiQOL.findNearby(null, sourceToken, distance) as Token[];
    if (includeSource) {
      aoeTargets.unshift(sourceToken);
    }
    const aoeTargetIds = aoeTargets.map((t) => t.document.id);
    (game.user as unknown as ITokenTargetUser)?.updateTokenTargets(aoeTargetIds);
    (game.user as unknown as ITokenTargetUser)?.broadcastActivity({ aoeTargetIds });
    return aoeTargets;
  }

  static updateUserTargets(targets: string[]) {
    (game.user as unknown as ITokenTargetUser).updateTokenTargets(targets);
  }

  static isConditionEffectAppliedAndActive(condition: string, actor: Actor.Known | Actor.Implementation | TImporterActor) {
    return DDBEffectHelper.getActorEffects(actor).some(
      (activeEffect: { name?: string; disabled?: boolean }) =>
        (activeEffect?.name?.toLowerCase() == condition.toLowerCase())
        && !activeEffect?.disabled,
    );
  }

  static getConditionEffectAppliedAndActive(condition: string, actor: Actor.Known | Actor.Implementation | TImporterActor) {
    return DDBEffectHelper.getActorEffects(actor).find(
      (activeEffect: { name?: string; disabled?: boolean }) =>
        (activeEffect?.name?.toLowerCase() == condition.toLowerCase())
        && !activeEffect?.disabled,
    );
  }

  static async removeCondition({ actor, actorUuid, conditionName, level = null }: {
    actor?: Actor.Implementation | Token;
    actorUuid?: string;
    conditionName?: string;
    level?: number | null;
  } = {}) {
    if (!actor) actor = await fromUuid(actorUuid) as unknown as Actor.Implementation;
    if (!actor) {
      logger.error("No actor passed to remove condition");
      return;
    }
    if (!conditionName) {
      logger.error("No conditionName passed to remove condition");
      return;
    }

    actor = ((actor as any).document ?? actor) as Actor.Implementation;
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
      await actor.update({ "system.attributes.exhaustion": level ?? 0 } as unknown as Parameters<typeof actor.update>[0]);
    }
  }

  static findCondition({ conditionName, forceSystemCondition = false }: { conditionName: string; forceSystemCondition?: boolean }) {
    const condition = CONFIG.statusEffects.find((se) =>
      se.name.toLowerCase() === conditionName.toLowerCase()
      && (!forceSystemCondition || (forceSystemCondition && se._id?.startsWith("dnd5e"))),
    )
      ?? CONFIG.statusEffects.find((se) =>
        se.id === utils.camelCase(conditionName)
        && (!forceSystemCondition || (forceSystemCondition && se._id?.startsWith("dnd5e"))),
      );

    if (!condition) {
      logger.error(`Condition ${conditionName} not found`);
      return null;
    }
    return condition as typeof condition & { level?: number; foundry?: string };
  }

  static async addCondition({ conditionName, actor, actorUuid, level = null, origin = null }: {
    conditionName?: string;
    actor?: Actor.Implementation;
    actorUuid?: string;
    level?: number | null;
    origin?: string | null;
  } = {}) {
    if (!actor) actor = await fromUuid(actorUuid) as unknown as Actor.Implementation;
    if (!actor) {
      logger.error("No actor passed to remove condition");
      return;
    }
    if (!conditionName) {
      logger.error("No conditionName passed to add condition");
      return;
    }

    const condition = DDBEffectHelper.findCondition({ conditionName, forceSystemCondition: true });

    if (!condition) {
      logger.error(`Condition ${conditionName} not found`);
      return;
    }

    const existing = actor.effects.get(condition.id);
    if (existing) return;

    logger.debug(`adding ${condition.name}`, { condition });

    const effect = await ActiveEffect.implementation.fromStatusEffect(condition.id);
    if (condition.level) effect.updateSource({ [`flags.dnd5e.${condition.id}Level`]: condition.level } as unknown as Parameters<typeof effect.updateSource>[0]);
    effect.updateSource({ origin } as unknown as Parameters<typeof effect.updateSource>[0]);
    ActiveEffect.implementation.create(effect, { parent: actor as unknown as Actor.Implementation, keepId: true });

    if (condition.foundry === "exhaustion") {
      logger.debug("Updating actor exhaustion", level);
      await actor.update({ "system.attributes.exhaustion": level ?? 1 } as any);
    }
  }

  static async adjustCondition({ add = false, remove = false, actor, conditionName, level = null, origin = null }: {
    add?: boolean;
    remove?: boolean;
    actor?: Actor.Implementation;
    conditionName?: string;
    level?: number | null;
    origin?: string | null;
  } = {}) {
    const gmUser = game.users.find((user) => user.active && user.isGM);
    if (!gmUser) {
      ui.notifications.error("No GM user found, unable to adjust condition");
      return;
    }
    if (!add && !remove) {
      logger.warn("You must specify if you want to add or remove the condition");
      return;
    }
    if (!actor) {
      logger.warn("adjustCondition: no actor supplied, unable to adjust condition");
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

  static extractListItems(text: string, { type = "ol", titleType = "em" } = {}): IExtractedHtmlItem[] {
    const results: IExtractedHtmlItem[] = [];
    const parsedDoc = utils.htmlToDoc(text);
    const list = parsedDoc.body.querySelector(type);
    if (list) {
      const listItems = list.querySelectorAll("li");
      listItems.forEach((item, index) => {
        // console.log('Item ' + (index + 1) + ': ' + item.textContent);
        const title = item.querySelector(titleType);
        const content = title?.nextSibling;
        if (!title || !content) return;
        results.push({
          number: index + 1,
          title: title.textContent?.replace(/\.$/, "").trim() ?? "",
          content: (content as HTMLElement).innerHTML ?? (content as Text).wholeText ?? content.textContent ?? "",
          full: item.innerHTML,
        });
      });
    }
    if (results.length > 0) return results;
    return DDBEffectHelper.extractParagraphItems(text, { titleType });
  }

  static extractParagraphItems(text: string, { type = "p", titleType = "em" } = {}): IExtractedHtmlItem[] {
    const results: IExtractedHtmlItem[] = [];
    const parsedDoc = utils.htmlToDoc(text);

    const listItems = parsedDoc.querySelectorAll(type);
    let i = 1;
    for (const item of listItems) {
      const title = item.querySelector(titleType);

      if (!title) continue;
      const content = title.nextSibling;
      if (!content) continue;
      results.push({
        number: i,
        title: title.textContent?.replace(/\.$/, "").trim() ?? "",
        content: (content as HTMLElement).innerHTML?.trim() ?? (content as Text).wholeText?.trim() ?? content.textContent?.trim() ?? "",
        full: item.innerHTML,
      });
      i++;
    }

    return results;
  }

  static async _verySimpleDamageRollToChat({ actor, flavor, formula, damageType = "damage", item, itemId, itemUuid }: {
    actor?: Actor;
    flavor?: string;
    formula?: string;
    damageType?: string;
    item?: Item.Implementation;
    itemId?: string;
    itemUuid?: string;
  } = {}) {
    if (!formula) {
      logger.warn("_verySimpleDamageRollToChat: no formula provided, skipping roll");
      return;
    }
    const roll = new CONFIG.Dice.DamageRoll(formula, {}, { type: damageType } as unknown as ConstructorParameters<typeof CONFIG.Dice.DamageRoll>[2]);
    await roll.evaluate({ async: true } as unknown as Parameters<typeof roll.evaluate>[0]);

    if (!item && itemId && !itemUuid && actor) {
      item = (actor as any).getEmbeddedDocument("Item", itemId) as unknown as Item.Implementation;
    }
    if (!item && itemUuid && actor) {
      item = await fromUuid(itemUuid) as unknown as Item.Implementation;
    }

    if (item && !itemId) itemId = item._id ?? undefined;
    if (item && !itemUuid) itemUuid = item.uuid ?? undefined;

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor as unknown as any }),
      flavor,
      "flags.dnd5e": {
        targets: dnd5e.utils.getTargetDescriptors(),
        roll: {
          type: "damage",
          itemId,
          itemUuid,
        },
      },

    } as unknown as Parameters<typeof roll.toMessage>[0]);
  }

  static async simpleDamageRollToChat({ event = undefined, actor, flavor, formulas = [], damageType = "damage", item, itemId, itemUuid, fastForward = false }: {
    event?: Event;
    actor?: Actor.Implementation;
    flavor?: string;
    formulas?: string[];
    damageType?: string;
    item?: Item.Implementation;
    itemId?: string;
    itemUuid?: string;
    fastForward?: boolean;
  } = {}) {

    if (!item && itemId && !itemUuid && actor) {
      item = actor.getEmbeddedDocument("Item", itemId) as unknown as Item.Implementation;
    }
    if (!item && itemUuid && actor) {
      item = await fromUuid(itemUuid) as unknown as Item.Implementation;
    }

    if (item && !itemId) itemId = item._id ?? undefined;
    if (item && !itemUuid) itemUuid = item.uuid ?? undefined;

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

    if ((Hooks as unknown as IDynamicHooks).call("dnd5e.preRollDamage", undefined, rollConfig) === false) return;
    const roll = await (globalThis.dnd5e.dice as unknown as { damageRoll: (config: object) => Promise<unknown> }).damageRoll(rollConfig);
    if (roll) (Hooks as unknown as IDynamicHooks).callAll("dnd5e.rollDamage", undefined, roll);
  }

  static syntheticItemWorkflowOptions({
    targets = undefined, showFullCard = false, scaling = false,
    configureDialog = false, targetConfirmation = undefined, slotLevel = undefined,
    createMeasuredTemplate = undefined, consumeResource = false, consumeSpellSlot = false,
  }: {
    targets?: Token[] | undefined;
    showFullCard?: boolean;
    scaling?: boolean;
    configureDialog?: boolean;
    targetConfirmation?: any;
    slotLevel?: number | undefined;
    createMeasuredTemplate?: boolean | undefined;
    consumeResource?: boolean;
    consumeSpellSlot?: boolean;
  } = {}) {
    return [
      // https://github.com/foundryvtt/dnd5e/blob/e0fca22b86ebd41086ba726e489132ce0a323243/module/documents/activity/mixin.mjs#L139
      {
        create: createMeasuredTemplate
          ? {
            createMeasuredTemplate: true,
          }
          : false,
        // concentration: {
        //   begin: true,
        //   end: true,
        // },
        showFullCard,
        createWorkflow: true,
        consume: {
          action: false,
          resource: consumeResource,
          spellSlot: consumeSpellSlot,
        },
        midiOptions: {
          targetUuids: targets,
        },
        spell: {
          slot: slotLevel,
        },
        scaling,
      },
      {
        targetUuids: targets,
        configureDialog,
        configure: configureDialog,
        options: {},
        workflowOptions: {
          autoRollDamage: "always",
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

  static getConcentrationEffect(actor: Actor.Implementation, documentName = "") {
    const concentrationEffectNames = DDBEffectHelper.getConcentrationNames(documentName);
    return actor.effects.find((ef: ActiveEffect) => concentrationEffectNames.some((c) => (ef as unknown as I5eEffectData).name?.startsWith(c)));
  }

  static overTimeDamage({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc }: {
    document: TAll5eItemDocuments;
    turn: string;
    damage: string;
    damageType: string;
    saveAbility: string | string[];
    saveRemove: boolean;
    saveDamage: string;
    dc: number | string;
  }) {
    return ChangeHelper.overTimeDamageChange({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc });
  }

  static overTimeSave({ document, turn, saveAbility, saveRemove = true, dc }: {
    document: TAll5eItemDocuments;
    turn: string;
    saveAbility: string | string[];
    saveRemove?: boolean;
    dc: number | string;
  }) {
    return ChangeHelper.overTimeSaveChange({ document, turn, saveAbility, saveRemove, dc });
  }

  static startOrEnd(text: string) {
    return DDBDescriptions.startOrEnd(text);
  }

  static overTimeSaveEnd({ document, effect, save, text }: Record<string, any>) {
    const change = MidiOverTimeEffect.getOverTimeSaveEndChange({ document, save, text });
    if (change) effect.system.changes.push(change);
  }

  static getSpecialDuration(effect: I5eEffectData, match: any) {
    return DDBDescriptions.addSpecialDurationFlagsToEffect(effect, match);
  }

  static DEFAULT_DURATION_SECONDS = 60;

  static getDuration(text: string, returnDefault = true) {
    return DDBDescriptions.getDuration(text, returnDefault);
  }

  static dcParser({ text } : { text: string }) {
    return DDBDescriptions.dcParser({ text });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static parseStatusCondition({ text, nameHint = null } : { text: string; nameHint?: string | null }) {
    return DDBDescriptions.parseStatusCondition({ text });
  }

  static filerActivitiesByIds(activities: any, ids: any[]) {
    const newActivities: Record<string, any> = {};
    if (ids.length > 0) {
      for (const [key, activity] of Object.entries(activities)) {
        if (ids.includes((activity as { _id?: string })._id)) newActivities[key] = activity;
      }
    }
    return newActivities;
  }

  static filterActivitiesByTypes(activities: any, types: any) {
    const newActivities: Record<string, any> = {};
    if (types.length > 0) {
      for (const [key, activity] of Object.entries(activities)) {
        if (types.includes((activity as { type?: string }).type)) newActivities[key] = activity;
      }
    }
    return newActivities;
  }


  static documentWithFilteredActivities({
    uuid = null, document = null, parent = null, activityIds = [], activityTypes = [], clearEffectFlags = false,
    clearEffects = false, filterEffects = true, newId = false, clearId = true, removeProperties = ["concentration"],
    setToAtWill = false, renameDocument = null, setTargetTo = "creature", clearTargetTemplate = true,
    overrideTarget = true, overrideDuration = true, durationUnits = "inst", durationValue = null,
    level = null, clearUses = true, addProperties = [], noSpellslot = true, clearTargets = true,
    clearActiveAuraEffects = true, killAnimations = false, filterActivityDamageTypes = [], returnDataOnly = false,
    retainEnchantments = false,
  }: {
    uuid?: string | null;
    document?: Item | null;
    parent?: any;
    activityIds?: string[];
    activityTypes?: string[];
    clearEffectFlags?: boolean;
    clearEffects?: boolean;
    filterEffects?: boolean;
    newId?: boolean;
    clearId?: boolean;
    removeProperties?: string[];
    setToAtWill?: boolean;
    renameDocument?: string | null;
    setTargetTo?: string;
    clearTargetTemplate?: boolean;
    overrideTarget?: boolean;
    overrideDuration?: boolean;
    durationUnits?: TDurationUnit;
    durationValue?: number | null;
    level?: number | null;
    clearUses?: boolean;
    addProperties?: string[];
    noSpellslot?: boolean;
    clearTargets?: boolean;
    clearActiveAuraEffects?: boolean;
    killAnimations?: boolean;
    filterActivityDamageTypes?: string[];
    returnDataOnly?: boolean;
    retainEnchantments?: boolean;
  } = {}): Item.Implementation | TAll5eItemDocuments | null {
    if (!uuid && !document) throw new Error("Must specify either uuid or document !");
    const base = document ?? fromUuidSync(uuid) as unknown as Item | null;
    if (!base) return null;
    const newDocumentData = base.toObject() as unknown as TAll5eItemDocuments;
    if (clearId) delete newDocumentData._id;
    if (newId) newDocumentData._id = foundry.utils.randomID();
    if ("activities" in newDocumentData.system) {
      if (activityIds.length > 0)
        newDocumentData.system.activities = DDBEffectHelper.filerActivitiesByIds(newDocumentData.system.activities, activityIds);
      if (activityTypes.length > 0)
        newDocumentData.system.activities = DDBEffectHelper.filterActivitiesByTypes(newDocumentData.system.activities, activityTypes);
    }

    if (clearActiveAuraEffects) {
      newDocumentData.effects = (newDocumentData.effects ?? []).filter((e: any) =>
        !foundry.utils.getProperty(e.flags, "ActiveAura.isAura"),
      );
    }

    if (retainEnchantments) {
      const enchantmentEffects = newDocumentData.effects?.filter((e: any) => e.type === "enchantment") ?? [];
      // newDocumentData.effects = newDocumentData.effects?.filter((e) => e.type === "enchantment") ?? [];
      foundry.utils.setProperty(newDocumentData, "flags.ddbimporter.effect.enchantmentEffects", enchantmentEffects);
      foundry.utils.setProperty(newDocumentData, "effects", []);
    } else if (clearEffects) {
      foundry.utils.setProperty(newDocumentData, "effects", []);
    }

    const activities = "activities" in newDocumentData.system ? newDocumentData.system.activities : {};
    for (const key of Object.keys(activities)) {
      const a = activities[key];

      if (a.consumption) a.consumption.targets = [];
      if (overrideTarget && a.target) a.target.override = true;
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
      if (a.duration) {
        if (overrideDuration) a.duration.override = true;
        if (durationUnits) {
          a.duration.units = durationUnits;
          a.duration.value = String(durationValue);
        }
      }

      if (clearTargets) foundry.utils.setProperty(a, "consumption.targets", []);
      if (noSpellslot) foundry.utils.setProperty(a, "consumption.spellSlot", false);

      if (filterActivityDamageTypes.length > 0 && "damage" in a && a.damage?.parts) {
        a.damage.parts = a.damage.parts.filter((part: any) =>
          part.types.some((partType: any) => filterActivityDamageTypes.includes(partType)),
        ).map((part: any) => {
          part.types = part.types.filter((partType: any) => filterActivityDamageTypes.includes(partType));
          return part;
        });
      }

      a.effects = (a.effects ?? []).filter((e: any) => (newDocumentData.effects ?? []).some((f: any) => f._id === e._id));

      if ("activities" in newDocumentData.system) newDocumentData.system.activities[key] = a;
    }

    if (clearEffectFlags) {
      foundry.utils.setProperty(newDocumentData, "flags.itemacro", {});
      foundry.utils.setProperty(newDocumentData, "flags.midi-qol", {});
      foundry.utils.setProperty(newDocumentData, "flags.midiProperties", {});
      foundry.utils.setProperty(newDocumentData, "flags.dae", {});
    }

    if (filterEffects && "activities" in newDocumentData.system) {
      const allowedIds = Object.values(newDocumentData.system.activities).map((a) => {
        return ((a as { effects?: { _id: string }[] }).effects ?? []).map((e) => e._id);
      }).flat();
      newDocumentData.effects = (newDocumentData.effects ?? []).filter((e: any) => allowedIds.includes(e._id));
    }
    if ("properties" in newDocumentData.system) {
      for (const prop of removeProperties) {
        newDocumentData.system.properties = utils.removeFromProperties(newDocumentData.system.properties ?? [], prop);
      }
      for (const prop of addProperties) {
        newDocumentData.system.properties = utils.addToProperties(newDocumentData.system.properties ?? [], prop);
      }
    }
    if (setToAtWill) {
      foundry.utils.setProperty(newDocumentData, "system.method", "atwill");
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

    if (level && "level" in newDocumentData.system) newDocumentData.system.level = level;

    if (killAnimations) foundry.utils.setProperty(newDocumentData, "flags.autoanimations.killAnim", true);

    logger.verbose("New document data", newDocumentData);
    // console.warn("New document data", newDocumentData);

    if (returnDataOnly) return newDocumentData;

    const newDocument = new CONFIG.Item.documentClass(newDocumentData as any, { parent });
    return newDocument as Item.Implementation;
  }

  static async rollMidiItemUse(document: Item.Implementation | TAll5eItemDocuments, workflowBuilderOptions = {}, {
    targetIds = [] as string[], applyFailureConditions = [] as string[],
  } = {}) {
    const saveTargets = game.user?.targets
      ? [...game.user.targets].map((t) => t.id).filter((id): id is string => id !== null)
      : [];
    if (targetIds.length > 0) (game.user as unknown as ITokenTargetUser).updateTokenTargets(targetIds);

    const [config, options] = DDBEffectHelper.syntheticItemWorkflowOptions(workflowBuilderOptions);

    logger.debug("Rolling item use", { document, config, options });

    const result = await MidiQOL.completeItemUse(document, config, options);

    if (targetIds.length > 0) (game.user as unknown as ITokenTargetUser).updateTokenTargets(saveTargets);

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

  static async rollMidiActivityUse(activity: any, workflowBuilderOptions = {}, {
    targetIds = [] as string[], applyFailureConditions = [] as string[],
  } = {}) {
    const saveTargets = game.user?.targets
      ? [...game.user.targets].map((t) => t.id).filter((id): id is string => id !== null)
      : [];
    if (targetIds.length > 0) (game.user as unknown as ITokenTargetUser).updateTokenTargets(targetIds);

    const [config, options] = DDBEffectHelper.syntheticItemWorkflowOptions(workflowBuilderOptions);

    logger.debug("Rolling activity use", { activity, config, options });

    // config/dialogue/message
    const result = await MidiQOL.completeActivityUse(activity, config, options);

    if (targetIds.length > 0) (game.user as unknown as ITokenTargetUser).updateTokenTargets(saveTargets);

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


  static async _conditionRemovalMidiRoll(targetToken: Token.Implementation, condition: string, {
    document = null,
    activity = null,
    type = null, // can be save or check, if null, will check flags
    ability = null, // e.g. wis, if null, will check flags
    saveDC = null, // if null, will use activity if present, otherwise spelldc
  }: {
    document?: Item.Implementation | null;
    activity?: IRemovalActivity | null;
    type?: string | null;
    ability?: string | null;
    saveDC?: number | null;
  } = {}) {
    const name = document?.name ?? "";
    const caster = document?.parent;
    const derivedActivity = activity
      ?? Object.values(foundry.utils.getProperty(document ?? {}, "system.activities") ?? {}).find((a) => a.type === "save");
    const casterSystem = caster?.system as unknown as { attributes?: { spell?: { dc?: number } } } | undefined;
    const derivedSaveDc = saveDC ?? derivedActivity?.save?.dc?.value ?? casterSystem?.attributes?.spell?.dc;
    if (!derivedSaveDc) throw new Error("No save DC specified, and no default spelldc found on document parent actor!");
    const removalCheck = foundry.utils.getProperty(document ?? {}, "flags.ddbimporter.effect.removalCheck");
    const removalSave = foundry.utils.getProperty(document ?? {}, "flags.ddbimporter.effect.removalSave");
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
    } as unknown as Parameters<typeof ChatMessage.getSpeaker>[0]);

    const rollResult = derivedType === "check"
      ? (await targetToken.actor.rollAbilityCheck({
        ability: derivedAbility,
      }, {}, { data: { speaker, flavor } }))[0].total
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
      } as unknown as ChatMessage.CreateInput);
    }
    return rollResult;
  }

  static async attemptConditionRemovalDialog(targetToken: Token.Implementation, condition: any, {
    document = null,
    activity = null,
    type = null, // can be save or check, if null, will check flags
    ability = null, // e.g. wis, if null, will check flags
    saveDC = null, // if null, will use activity if present, otherwise spelldc
    ask = true,
    checkConditionExists = true,
  }: {
    document?: Item.Implementation | null;
    activity?: IRemovalActivity | null;
    type?: string | null;
    ability?: string | null;
    saveDC?: number | null;
    ask?: boolean;
    checkConditionExists?: boolean;
  } = {}) {
    if (!DDBEffectHelper.isConditionEffectAppliedAndActive(condition, targetToken.actor)
      && checkConditionExists)
      return;

    if (ask) {
      foundry.applications.api.DialogV2.wait({
        window: { title: `Use action to attempt to remove ${condition}?` },
        content: "",
        buttons: [
          {
            action: "one",
            label: "Yes",
            default: true,
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
          {
            action: "two",
            label: "No",
            callback: () => {
              ChatMessage.create({
                content: `${targetToken.name} retains the ${condition} condition.`,
              } as unknown as ChatMessage.CreateInput);
            },
          },
        ],
        rejectClose: false,
      } as any);
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

  static isEffectExpired(effect: any) {
    if (game.modules.get("times-up")?.active && (globalThis as any).TimesUp.isEffectExpired) {
      return (globalThis as any).TimesUp.isEffectExpired(effect);
    }
    return effect.duration.remaining <= 0;
  }

  static async deleteEffectsByUuid({ effectsToDelete = [] as string[] } = {}) {
    for (const effectUuid of effectsToDelete) {
      const effect = await fromUuid(effectUuid);
      if (effect && !DDBEffectHelper.isEffectExpired(effect)) {
        if ((effect as ActiveEffect.Implementation).transfer)
          // fvtt-types UpdateInput for ActiveEffect does not accept a plain partial under strictNullChecks
          await (effect as ActiveEffect.Implementation).update({ disabled: true } as unknown as Parameters<ActiveEffect.Implementation["update"]>[0]);
        else
          await effect.delete();
      }
    }
  }

  static async createEffects({ actorUuid, effects = [], options }: {
    actorUuid?: string;
    effects?: { transfer?: boolean }[];
    options?: Record<string, unknown>;
  } = {}) {
    if (!actorUuid) {
      logger.warn("createEffects: no actorUuid provided");
      return undefined;
    }
    const actor = DDBEffectHelper.fromActorUuid(actorUuid);
    for (const effect of effects) { // override default foundry behaviour of blank being transfer
      if (effect.transfer === undefined) effect.transfer = false;
    }
    return (actor as unknown as {
      createEmbeddedDocuments(embeddedName: string, data: object[], operation?: object): Promise<unknown>;
    })?.createEmbeddedDocuments("ActiveEffect", effects, options);
  }

  static async updateEffects({ actorUuid, updates = [] }: {
    actorUuid?: string;
    updates?: Record<string, unknown>[];
  } = {}) {
    if (!actorUuid) {
      logger.warn("updateEffects: no actorUuid provided");
      return undefined;
    }
    const actor = DDBEffectHelper.fromActorUuid(actorUuid);
    return (actor as unknown as {
      updateEmbeddedDocuments(embeddedName: string, updates: object[]): Promise<unknown>;
    })?.updateEmbeddedDocuments("ActiveEffect", updates);
  }

  static FLAG_NAME = "ddbihelpers";

  static getFlag(entity: any, flagId: string) {
    if (!entity) return logger.error(`ddbeffecthelper getFlag: actor not defined`);
    let theActor;
    if (typeof entity === "string") {
      theActor = canvas.tokens?.get(entity)?.actor;
      if (!theActor) theActor = game.actors?.get(entity);
      if (!theActor) {
        const actor = fromUuidSync(entity);
        theActor = (actor as unknown as { actor?: Actor.Implementation }).actor ?? actor;
      }
    } else if (entity instanceof Actor) {
      theActor = entity;
    } else {
      theActor = entity.actor;
    }

    if (!theActor) return logger.error(`ddbeffecthelper getFlag: actor not defined`);
    const flag = foundry.utils.getProperty(theActor, `flags.${DDBEffectHelper.FLAG_NAME}.${flagId}`);
    logger.verbose("ddbeffecthelper get flag ", {
      entity,
      theActor,
      flag,
    });
    return flag;
  }

  static async _setFlag({ actorUuid, actorId, flagId, value }: {
    actorUuid?: string;
    actorId?: string;
    flagId?: string;
    value?: unknown;
  } = {}) {
    if (!flagId) return logger.error(`_setFlag: no flagId provided`);
    const actor = actorUuid
      ? await DDBEffectHelper.fromActorUuid(actorUuid)
      : actorId
        ? await game.actors?.get(actorId)
        : undefined;
    if (!actor) return logger.error(`_setFlag: actor not discovered, please provide actorUuid or actorId`);

    const flags = {
      [DDBEffectHelper.FLAG_NAME]: {
        [flagId]: value,
      },
    };

    logger.verbose("ddbeffecthelper set flag ", {
      actor,
      flags,
    });

    return (actor as unknown as { update(data: object): Promise<unknown> }).update({
      flags: {
        [DDBEffectHelper.FLAG_NAME]: {
          [flagId]: value,
        },
      },
    });
  }

  static async _unsetFlag({ actorUuid, flagId }: {
    actorUuid?: string;
    flagId?: string;
  } = {}) {
    if (!actorUuid || !flagId) return logger.error(`_unsetFlag: actorUuid and flagId are required`);
    const actor = await DDBEffectHelper.fromActorUuid(actorUuid);
    if (!actor) return logger.error(`_unsetFlag: actor not defined`);
    const head = flagId.split(".");
    const tail = `-=${head.pop()}`;
    const key = ["flags", DDBEffectHelper.FLAG_NAME, ...head, tail].join(".");
    return actor.update({ [key]: null });
  }

  static async setFlag(targetActor: Actor | Actor.Implementation | foundry.canvas.placeables.Token | string, flagId: string, value: any) {
    if (typeof targetActor === "string" && (targetActor.startsWith("Scene") || targetActor.startsWith("Actor"))) {
      return globalThis.DDBImporter.socket.executeAsGM("setFlag", { actorUuid: targetActor, flagId, value });
    } else if (typeof targetActor === "string") {
      return globalThis.DDBImporter.socket.executeAsGM("setFlag", { actorId: targetActor, flagId, value });
    }
    let actor = null;
    if (targetActor instanceof foundry.canvas.placeables.Token) actor = targetActor.actor;
    if (targetActor instanceof Actor) actor = targetActor;
    if (!actor) return logger.error(`setFlag: actor not defined`);
    return globalThis.DDBImporter.socket.executeAsGM("setFlag", {
      actorId: actor.id,
      actorUuid: actor.uuid,
      flagId,
      value,
    });
  }

  static async unsetFlag(targetActor: Actor | Actor.Implementation | foundry.canvas.placeables.Token | string, flagId: string) {
    if (typeof targetActor === "string" && (targetActor.startsWith("Scene") || targetActor.startsWith("Actor"))) {
      return globalThis.DDBImporter.socket.executeAsGM("unsetFlag", { actorUuid: targetActor, flagId });
    } else if (typeof targetActor === "string") {
      return globalThis.DDBImporter.socket.executeAsGM("unsetFlag", { actorId: targetActor, flagId });
    }
    let actor = null;
    if (targetActor instanceof foundry.canvas.placeables.Token) actor = targetActor.actor;
    if (targetActor instanceof Actor) actor = targetActor;
    if (!actor) return logger.error(`dae.setFlag: actor not defined`);
    return globalThis.DDBImporter.socket.executeAsGM("unsetFlag", {
      actorId: actor.id,
      actorUuid: actor.uuid,
      flagId,
    });
  }

  /**
   * Replaces the current workflow activity damage types with NEW_DAMAGE_TYPE.
   *
   * @param {MidiQOL.Workflow} currentWorkflow The current midi-qol workflow.
   * @param {Array} damageTypes array of damage types to replace with
   */
  static replaceActivityDamageMidi(currentWorkflow: any, damageTypes: any = []) {
    // Change temporarely the damage types of the activity, but make a temporary copy before applying changes
    // and keep the original values in a flag
    const currentActivity = currentWorkflow.activity;
    if (
      currentActivity?.damage?.parts?.length
      && !foundry.utils.getProperty(currentWorkflow, "planarWarrior.origActivityDmgParts")
    ) {
      const origParts = currentActivity.damage.parts;
      // Set in memory and recompute activity derived data
      foundry.utils.setProperty(currentWorkflow, "planarWarrior.origActivityDmgParts", origParts);
      const parts = foundry.utils.deepClone(currentActivity.damage.parts);
      parts.forEach((d: any) => (d.types = new Set(damageTypes)));
      currentActivity.damage.parts = parts;
      currentActivity.prepareData();
    }
  }

  /**
   * Reverts the temporary workflow activity damage changes with the original values.
   *
   * @param {MidiQOL.Workflow} currentWorkflow The current midi-qol workflow.
   */
  static revertActivityDamageMidi(currentWorkflow: any) {
    // Revert activity to original damage
    const origParts = foundry.utils.getProperty(currentWorkflow, "planarWarrior.origActivityDmgParts");
    if (!origParts || !currentWorkflow.activity?.damage?.parts) {
      return;
    }

    // Set in memory and recompute activity derived data
    currentWorkflow.activity.damage.parts = origParts;
    currentWorkflow.activity.prepareData();
    foundry.utils.setProperty(currentWorkflow, "planarWarrior.origActivityDmgParts", null);
  }


}
