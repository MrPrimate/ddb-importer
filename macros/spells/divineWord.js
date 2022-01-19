if (!game.modules.get("advanced-macros")?.active) {
  ui.notifications.error("Please enable the Advanced Macros module");
  return;
}
const lastArg = args[args.length - 1];

//DAE Macro Execute, Effect Value = "Macro Name"
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const targetToken = await fromUuid(lastArg.tokenUuid);

function effectAppliedAndActive(conditionName) {
  return targetToken.data.effects.some(
    (activeEffect) =>
      activeEffect?.data?.flags?.isConvenient &&
      activeEffect?.data?.label == conditionName &&
      !activeEffect?.data?.disabled
  );
}

async function DivineWordApply(target, targetHp) {
  if (targetHp <= 20) {
    await target.actor.update({ "data.attributes.hp.value": 0 });
  } else {
    if (targetHp <= 30) {
      const hasStunned = effectAppliedAndActive("Stunned");
      if (!hasStunned) await game.dfreds.effectInterface.toggleEffect("Stunned", { uuids: [targetActor.uuid] });
      game.Gametime.doIn({ hours: 1 }, async () => {
        await game.dfreds.effectInterface.removeEffect({ effectName: "Stunned", uuid: targetActor.uuid });
      });
    }
    if (targetHp <= 40) {
      const hasBlinded = effectAppliedAndActive("Blinded");
      if (!hasBlinded) await game.dfreds.effectInterface.toggleEffect("Blinded", { uuids: [targetActor.uuid] });
      game.Gametime.doIn({ hours: 1 }, async () => {
        await game.dfreds.effectInterface.removeEffect({ effectName: "Blinded", uuid: [targetActor.uuid] });
      });
    }
    if (targetHp <= 50) {
      const hasDeafened = effectAppliedAndActive("Deafened");
      if (!hasDeafened) await game.dfreds.effectInterface.toggleEffect("Deafened", { uuids: [targetActor.uuid] });
      game.Gametime.doIn({ hours: 1 }, async () => {
        await game.dfreds.effectInterface.removeEffect({ effectName: "Deafened", uuid: targetActor.uuid });
      });
    }
  }
}
if (args[0] === "on") {
  DivineWordApply(targetToken, targetToken.actor.data.data.attributes.hp.value);
}
