const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const DAEItem = lastArg.efData.flags.dae.itemData;

const caster = canvas.tokens.placeables.find((token) => token?.actor?.items.get(DAEItem._id) !== null);

async function setWardingBondHook() {
  const hookId = Hooks.on("preUpdateActor", async (actor, update) => {
    const flag = await DAE.getFlag(targetActor, "WardingBondIds");
    if (flag.targetID !== actor.id) return;
    if (!("actorData.system.attributes.hp" in update)) return;
    const oldHP = actor.system.attributes.hp.value;
    const newHP = foundry.utils.getProperty(update, "system.attributes.hp.value");
    const hpChange = oldHP - newHP;
    if (Number.isInteger(hpChange) && hpChange > 0) {
      const caster = game.actors.get(flag.casterID).getActiveTokens()[0];
      caster.actor.applyDamage(hpChange);
    }
    if (newHP === 0) {
      const effectIds = targetActor.effects.filter((e) => e.label === "Warding Bond").map((t) => t.id);
      await targetActor.deleteEmbeddedDocuments("ActiveEffect", effectIds);
    }
  });
  DAE.setFlag(targetActor, "WardingBondHook", hookId);
}

if (args[0] === "on") {
  await DAE.setFlag(targetActor, "WardingBondIds", {
    targetID: targetActor.id,
    casterID: caster.actor.id,
  });
  setWardingBondHook();
}

if (args[0] === "off") {
  const flag = await DAE.getFlag(targetActor, "WardingBondHook");
  await Hooks.off("preUpdateActor", flag);
  DAE.unsetFlag(targetActor, "WardingBondHook");
  DAE.unsetFlag(targetActor, "WardingBondIds");
  console.log("Warding Bond removed");
}
