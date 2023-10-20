/* eslint-disable no-await-in-loop */

import OriginFixer from "../../lib/OriginFixer.js";

async function createActorHook(actor, options, user) {
  console.warn("ddb createActorHook", {actor, options, user});
  // Can't do this in preCreate because the actor id doesn't exist yet.
  if (options.keepId) return;
  if (game.user?.id !== user) return;
  if (game.modules.get("dnd5e-scriptlets")?.active && game.settings.get("dnd5e-scriptlets", "UpdateCreatedOrigins")) {
    console.warn("running ddb migrate, compendium only, actor")
    await OriginFixer.updateActorEffects(actor, true);
  } else {
    console.warn("running ddb migrate, actor")
    await OriginFixer.updateActorEffects(actor);
  }
}

async function createTokenHook(tokenDocument, options, user) {
  if (options.keepId) return;
  if (game.user.id !== user) return;
  if (game.modules.get("dnd5e-scriptlets")?.active && game.settings.get("dnd5e-scriptlets", "UpdateCreatedOrigins")) {
    console.warn("running ddb migrate, compendium only, token")
    await OriginFixer.updateActorEffects(tokenDocument.actor, true);
  } else {
    console.warn("running ddb migrate, token ")
    await OriginFixer.updateActorEffects(tokenDocument.actor);
  }
}

export function setupUpdateCreatedOrigins() {
  console.warn("HHHHHHOOOOLS")
  Hooks.on("createActor", createActorHook);
  Hooks.on("createToken", createTokenHook);
}
