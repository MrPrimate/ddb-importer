const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const DAEItem = lastArg.efData.flags.dae.itemData;
const saveData = DAEItem.system.save;

if (args[0] === "on") {
  await DAE.setFlag(targetActor, "fleshToStoneSpell", {
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
    await DAE.setFlag(targetActor, "fleshToStoneSpell", flag);

    if (flag.failures === 3) {
      ChatMessage.create({ content: `Flesh To Stone on ${targetActor.name} is complete` });
      if (!DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("Petrified", targetActor)) {
        DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: "Petrified", actor: targetActor });
      }
    } else {
      console.log(`Flesh To Stone failures increments to ${flag.failures} and ${flag.successes}`);
    }
  } else if (saveRoll.total >= saveData.dc) {
    flag.successes += 1;
    await DAE.setFlag(targetActor, "fleshToStoneSpell", flag);

    if (flag.successes === 3) {
      ChatMessage.create({ content: `Flesh To Stone on ${targetActor.name} ends` });
      await targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
    } else {
      console.log(`Flesh To Stone failures increments to ${flag.failures} and ${flag.successes}`);
    }
  }
}

if (args[0] === "each") {
  let flag = DAE.getFlag(targetActor, "fleshToStoneSpell");
  flag.rounds += 1;
  if (flag.failures === 3) {
    await DAE.setFlag(targetActor, "fleshToStoneSpell", flag);
  } else {
    await checkPetrification(flag);
  }
}

if (args[0] === "off") {
  ChatMessage.create({
    content: `Flesh to stone ends, if concentration was maintained for the entire duration, the creature (${targetActor.name}) is turned to stone until the effect is removed.`,
  });

  const flag = await DAE.getFlag(targetActor, "fleshToStoneSpell");
  if (flag && flag.rounds < 10) {
    if (DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("Petrified", targetActor)) {
      DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "Petrified", actor: targetActor });
    }
  }

  await DAE.unsetFlag(targetActor, "fleshToStoneSpell");
}
