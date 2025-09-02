
import { OriginFixer } from "../../lib/_module.mjs";

async function createActorHook(actor, options, user) {
  // Can't do this in preCreate because the actor id doesn't exist yet.
  if (options.keepId) return;
  if (game.user?.id !== user) return;
  await OriginFixer.updateActorEffects(actor);
}

async function createTokenHook(tokenDocument, options, user) {
  if (options.keepId) return;
  if (game.user.id !== user) return;
  await OriginFixer.updateActorEffects(tokenDocument.actor);
}

export function setupUpdateCreatedOrigins() {
  Hooks.on("createActor", createActorHook);
  Hooks.on("createToken", createTokenHook);
}
