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
      const isDDBMonsterCompendium = (effect.origin as string | null)?.startsWith(`Compendium.${CompendiumHelper.getCompendiumLabel("monsters")}.`);
      const matchRe = compendiumOnly || isDDBMonsterCompendium ? OriginFixer.COMPENDIUM_ORIGIN_RE : OriginFixer.ORIGIN_RE;
      const effectOrigin = effect.origin as string | null;
      if (typeof effectOrigin === "string"
        && effectOrigin.match(matchRe)
        && (!effectOrigin.startsWith("Compendium") || isDDBMonsterCompendium)
      ) {
        const testOrigin = OriginFixer._getEffectOrigin(effect.origin, actorUuid, (compendiumOnly || isDDBMonsterCompendium));
        const originLoaded = await fromUuid(testOrigin);
        if (originLoaded && testOrigin !== effect.origin) {
          changesMade = true;
          logger.debug(`${actor.name} effect ${effect.name} origin ${effect.origin} -> ${testOrigin} ${actorUuid}`);
          newEffect.origin = testOrigin;
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
