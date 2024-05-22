const lastArg = args[args.length - 1];

// DAE Macro Execute, Effect Value = "Macro Name"
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const targetToken = await fromUuid(lastArg.tokenUuid);

function effectAppliedAndActive(conditionName) {
  return DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("conditionName", targetActor));
}

async function DivineWordApply(target, targetHp) {
  if (targetHp <= 20) {
    await target.actor.update({ "system.attributes.hp.value": 0 });
  } else {
    if (targetHp <= 30) {
      const hasStunned = effectAppliedAndActive("Stunned");
      if (!hasStunned) await DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: "Stunned", actor: targetActor });
      game.Gametime.doIn({ hours: 1 }, async () => {
        await DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "Stunned", actor: targetActor });
      });
    }
    if (targetHp <= 40) {
      const hasBlinded = effectAppliedAndActive("Blinded");
      if (!hasBlinded) await DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: "Blinded", actor: targetActor });
      game.Gametime.doIn({ hours: 1 }, async () => {
        await DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "Blinded", actor: targetActor });
      });
    }
    if (targetHp <= 50) {
      const hasDeafened = effectAppliedAndActive("Deafened");
      if (!hasDeafened) await DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: "Deafened", actor: targetActor });
      game.Gametime.doIn({ hours: 1 }, async () => {
        await DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "Deafened", actor: targetActor });
      });
    }
  }
}
if (args[0] === "on") {
  DivineWordApply(targetToken, targetToken.actor.system.attributes.hp.value);
}
