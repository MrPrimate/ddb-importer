import logger from "./Logger";
import CompendiumHelper from "./CompendiumHelper";

export default class OriginFixer {

  static ORIGIN_RE = /(.*)Actor\.([^.]+)(.*)$/g;

  // Some old DDB Actor parsings would add bad origins here
  static COMPENDIUM_ORIGIN_RE = /Compendium\.(.*)(?:Actor|null)\.([^.]+)(.*)$/g;

  static TOKEN_ORIGIN_RE = /(Scene.[^.]+.Token.[^.]+.Actor\.[^.]+)(.*)$/g;

  static _getEffectOrigin(effectOrigin: string, actorUuid: string, compendium = false) {
    if (compendium) {
      return effectOrigin.replace(OriginFixer.COMPENDIUM_ORIGIN_RE, `${actorUuid}.$2$3`);
    } else if (effectOrigin.match(OriginFixer.TOKEN_ORIGIN_RE)) {
      return effectOrigin.replace(OriginFixer.TOKEN_ORIGIN_RE, `${actorUuid}$2`);
    } else {
      return effectOrigin.replace(OriginFixer.ORIGIN_RE, `${actorUuid}$3`);
    }
  }

  static async updateActorEffects(actor: Actor.Implementation | null, compendiumOnly = false) {
    if (!actor) return;
    const newEffects = [];
    const actorUuid = (actor.uuid ?? "").replace("..", ".");
    let changesMade = false;

    for (const effect of actor.effects) {
      const newEffect = effect.toObject() as I5eEffectData;

      const fixOrigin = async (effectOrigin: string | null | undefined): Promise<string | null> => {
        const isDDBMonsterCompendium = effectOrigin?.startsWith(`Compendium.${CompendiumHelper.getCompendiumLabel("monsters")}.`) ?? false;
        const matchRe = compendiumOnly || isDDBMonsterCompendium ? OriginFixer.COMPENDIUM_ORIGIN_RE : OriginFixer.ORIGIN_RE;
        if (typeof effectOrigin !== "string"
          || !effectOrigin.match(matchRe)
          || (effectOrigin.startsWith("Compendium") && !isDDBMonsterCompendium)
        ) return null;
        const testOrigin = OriginFixer._getEffectOrigin(effectOrigin, actorUuid, (compendiumOnly || isDDBMonsterCompendium));
        if (testOrigin === effectOrigin) return null;
        const originLoaded = await fromUuid(testOrigin);
        return originLoaded ? testOrigin : null;
      };

      const fixedLegacy = await fixOrigin(effect.origin as string | null);
      if (fixedLegacy) {
        changesMade = true;
        logger.debug(`${actor.name} effect ${effect.name} origin ${effect.origin} -> ${fixedLegacy} ${actorUuid}`);
        newEffect.origin = fixedLegacy;
      }

      // dnd5e 6.0 structured origins (system.origin.*): relative uuids never match the
      // broken-absolute patterns, so only absolute strings pointing at the wrong actor change
      const systemOrigin = (newEffect.system as { origin?: Record<string, string | undefined> } | undefined)?.origin;
      for (const field of ["activity", "actor", "effect", "item"]) {
        const fixed = await fixOrigin(systemOrigin?.[field]);
        if (fixed && systemOrigin) {
          changesMade = true;
          logger.debug(`${actor.name} effect ${effect.name} system.origin.${field} ${systemOrigin[field]} -> ${fixed}`);
          systemOrigin[field] = fixed;
        }
      }

      newEffects.push(newEffect);
    }
    if (changesMade) {
      logger.debug(`Replacing effects on actor ${actor.name} [${actorUuid}]`, newEffects);
      await actor.updateEmbeddedDocuments("ActiveEffect", newEffects as any[]);
    }
  }

  static async fixActorOrigins(actor: Actor.Implementation) {
    await OriginFixer.updateActorEffects(actor);
  }

  static async fixTokenOrigins(tokenOrTokenDocument: Record<string, any>) {
    if (!tokenOrTokenDocument.actor) return;
    await OriginFixer.updateActorEffects(tokenOrTokenDocument.actor);
  }

  static async fixActorOriginsForAllActors() {
    for (const actor of game.actors) {
      await OriginFixer.updateActorEffects(actor);
    }
  }

  static async fixTokenOriginsForScene(scene: Scene.Implementation) {
    for (const token of scene.tokens) {
      await OriginFixer.updateActorEffects(token.actor);
    }
  }

  static async fixTokenOriginsForActiveScene() {
    if (!game.scenes.active) return;
    await OriginFixer.fixTokenOriginsForScene(game.scenes.active);
  }

  static async fixTokenOriginsForAllScenes() {
    for (const scene of game.scenes) {
      await OriginFixer.fixTokenOriginsForScene(scene);
    }
  }

}
