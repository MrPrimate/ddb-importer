
import { OriginFixer } from "../../lib/_module";

async function createActorHook(actor: Actor.Implementation, options: Record<string, any>, user: string) {
  // Can't do this in preCreate because the actor id doesn't exist yet.
  if (options.keepId) return;
  if (game.user?.id !== user) return;
  await OriginFixer.updateActorEffects(actor);
}

async function createTokenHook(tokenDocument: TokenDocument.Implementation, options: Record<string, any>, user: string) {
  if (options.keepId) return;
  if (game.user.id !== user) return;
  await OriginFixer.updateActorEffects(tokenDocument.actor);
}

export function setupUpdateCreatedOrigins() {
  Hooks.on("createActor", createActorHook);
  Hooks.on("createToken", createTokenHook);
}
