/* eslint-disable no-await-in-loop */

import logger from "../logger.js";
import CompendiumHelper from "./CompendiumHelper.js";

export default class OriginFixer {

  static ORIGIN_RE = /(.*)Actor\.([^.]+)(.*)$/g;

  // Some old DDB Actor parsings would add bad origins here
  static COMPENDIUM_ORIGIN_RE = /Compendium\.(.*)(?:Actor|null)\.([^.]+)(.*)$/g;

  static TOKEN_ORIGIN_RE = /(Scene.[^.]+.Token.[^.]+.Actor\.[^.]+)(.*)$/g;

  static _getEffectOrigin(effect, actorUuid, compendium = false) {
    console.warn("effect origin", {
      effect,
      actorUuid,
      compendium
    });
    if (compendium) {
      return effect.origin.replace(OriginFixer.COMPENDIUM_ORIGIN_RE, `${actorUuid}.$2$3`);
    } else if (effect.origin.match(OriginFixer.TOKEN_ORIGIN_RE)) {
      return effect.origin.replace(OriginFixer.TOKEN_ORIGIN_RE, `${actorUuid}$2`);
    } else {
      return effect.origin.replace(OriginFixer.ORIGIN_RE, `${actorUuid}$3`);
    }
  }

  static async updateActorEffects(actor, compendiumOnly = false) {
    console.warn("Actor", actor);
    if (!actor) return;
    const newEffects = [];
    const actorUuid = actor.uuid.replace("..", ".");
    let changesMade = false;

    console.warn("actorUuid", actorUuid);
    for (const effect of actor.effects) {
      const newEffect = effect.toObject();
      const isDDBMonsterCompendium = effect.origin?.startsWith(`Compendium.${CompendiumHelper.getCompendiumLabel("monsters")}.`);
      const matchRe = compendiumOnly || isDDBMonsterCompendium ? OriginFixer.COMPENDIUM_ORIGIN_RE : OriginFixer.ORIGIN_RE;
      console.warn("effect", {
        effect,
        isDDBMonsterCompendium,
        matchRe,
        match: effect.origin.match(matchRe),
        cmatch: effect.origin.match(OriginFixer.COMPENDIUM_ORIGIN_RE),
        omatch: effect.origin.match(OriginFixer.ORIGIN_RE),
        compMatch: (!effect.origin.startsWith("Compendium") || isDDBMonsterCompendium),
      });
      if (typeof effect.origin === "string"
        && effect.origin.match(matchRe)
        && (!effect.origin.startsWith("Compendium") || isDDBMonsterCompendium)
      ) {
        const testOrigin = OriginFixer._getEffectOrigin(effect, actorUuid, (compendiumOnly || isDDBMonsterCompendium));
        console.warn("testOrigin", {
          effect,
          testOrigin
        })
        const originLoaded = await fromUuid(testOrigin);

        console.warn("Origins", {
          effect,
          testOrigin,
          originLoaded
        })
        if (originLoaded && testOrigin !== effect.origin) {
          changesMade = true;
          logger.debug(`${actor.name} effect ${effect.name} origin ${effect.origin} -> ${testOrigin} ${actorUuid}`);
          newEffect.origin = testOrigin;
        }
      }
      newEffects.push(newEffect);
    }
    if (changesMade) {
      console.warn("NewEffects", newEffects);
      await actor.updateEmbeddedDocuments("ActiveEffect", newEffects);
    }
  }

  static async fixActorOrigins(actor) {
    await OriginFixer.updateActorEffects(actor);
  }

  static async fixTokenOrigins(tokenOrTokenDocument) {
    if (!tokenOrTokenDocument.actor) return;
    await OriginFixer.updateActorEffects(tokenOrTokenDocument.actor);
  }

  static async fixActorOriginsForAllActors() {
    for (const actor of game.actors) {
      await OriginFixer.updateActorEffects(actor);
    }
  }

  static async fixTokenOriginsForScene(scene) {
    for (const token of scene.tokens) {
      await OriginFixer.updateActorEffects(token.actor);
    }
  }

  static async fixTokenOriginsForActiveScene() {
    await OriginFixer.fixTokenOriginsForScene(game.scenes.active);
  }

  static async fixTokenOriginsForAllScenes() {
    for (const scene of game.scenes) {
      await OriginFixer.fixTokenOriginsForScene(scene);
    }
  }

}
