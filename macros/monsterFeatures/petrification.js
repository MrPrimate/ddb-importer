const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const DAEItem = lastArg.efData.flags.dae.itemData;
const saveData = DAEItem.system.save;

const petrifiedAtFailureCount = 2;
const totalSuccessesNeededToEnd = 1;

if (args[0] === "on") {
  await DAE.setFlag(targetActor, "petrificationEffect", {
    successes: 0,
    failures: 1,
    rounds: 1,
  });
}

async function checkPetrification(flag) {
  const flavor = `${CONFIG.DND5E.abilities[saveData.ability].label} DC${saveData.dc} ${DAEItem?.name || ""}`;
  const saveRoll = await targetActor.rollAbilitySave(saveData.ability, { flavor, fastForward: true });

  if (saveRoll.total < saveData.dc) {
    flag.failures += 1;
    await DAE.setFlag(targetActor, "petrificationEffect", flag);

    if (flag.failures === petrifiedAtFailureCount) {
      ChatMessage.create({ content: `Petrification on ${targetActor.name} is complete` });
      if (!DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("Petrified", targetActor)) {
        DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: "Petrified", actor: targetActor });
      }
    } else {
      console.log(`Petrification failures increments to ${flag.failures} failures and ${flag.successes} successes`);
    }
  } else if (saveRoll.total >= saveData.dc) {
    flag.successes += 1;
    await DAE.setFlag(targetActor, "petrificationEffect", flag);

    if (flag.successes >= totalSuccessesNeededToEnd) {
      ChatMessage.create({ content: `Petrification attempt on ${targetActor.name} ends` });
      await targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
    } else {
      console.log(`Petrification failures increments to ${flag.failures} failures and ${flag.successes} successes`);
    }
  }
}

if (args[0] === "each") {
  let flag = DAE.getFlag(targetActor, "petrificationEffect");
  flag.rounds += 1;
  if (flag.rounds > 2) {
    await DAE.setFlag(targetActor, "petrificationEffect", flag);
  } else {
    await checkPetrification(flag);
  }
}

if (args[0] === "off") {
  await DAE.unsetFlag(targetActor, "petrificationEffect");
}
