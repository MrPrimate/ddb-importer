const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

/**
 * Generates dialog for selecting final Effect, updates target effect with name, icon and new DAE effects.
 */
async function applyContagion(targetActor) {
  const buttons = {};

  for (const [key, data] of Object.entries(CONFIG.DND5E.abilities)) {
    buttons[key] = {
      label: data.label,
      callback: async () => {
        const originalEffect = targetActor.effects.find((a) => a.origin === item.uuid);
        let effect = {
          changes: originalEffect.changes.concat([
            {
              key: `flags.midi-qol.disadvantage.ability.save.${key}`,
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              priority: 20,
              value: "1",
            },
          ]),
          img: data.icon,
          name: `${originalEffect.name}: ${data.label}`,
          _id: originalEffect._id,
        };
        await DDBImporter.socket.executeAsGM("updateEffects", {
          actorUuid: targetActor.uuid,
          updates: [effect],
        });
      },
    };
  }

  new Dialog({
    title: "Contagion options",
    content: "<p>Select the ability</p>",
    buttons,
  }).render(true);
}

async function removeMacro(targetActor) {
  const originalEffect = targetActor.effects.find((a) => a.origin === item.uuid);
  const effect = {
    changes: originalEffect.changes.filter((c) => !c.key.startsWith("macro")),
    _id: originalEffect._id,
  };
  await DDBImporter.socket.executeAsGM("updateEffects", {
    actorUuid: targetActor.uuid,
    updates: [effect],
  });
}

/**
 * Execute contagion effects, update flag counts or remove effect
 * @param targetActor
 */
async function contagionSave(targetActor) {
  const flag = DAE.getFlag(targetActor, "ContagionSpell");
  const flavor = `${CONFIG.DND5E.abilities["con"].label} DC${flag.saveDC} ${item?.name || ""}`;
  const saveRoll = await targetActor.rollAbilitySave("con", { flavor });

  if (saveRoll.total >= flag.saveDC) {
    flag.success += 1;
  } else {
    flag.failure += 1;
  }
  DAE.setFlag(targetActor, "ContagionSpell", flag);
  console.log(`Contagion counters are ${flag.success} successes and ${flag.failure} failures`);

  if (flag.failure >= 3) {
    ChatMessage.create({ content: `3 ${item.name} save failures on ${targetActor.name}, they are sick for 7 days.` });
    await removeMacro(targetActor);
  } else if (flag.success >= 3) {
    ChatMessage.create({ content: `3 ${item.name} save successes on ${targetActor.name}, the spell ends.` });
    targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
  } else {
    ChatMessage.create({ content: `${targetActor.name} saves for ${item.name}: ${flag.failure} failures, ${flag.success} successes.` });
  }
}

if (args[0].tag == "OnUse") {
  for (const targetToken of workflow.targets) {
    DAE.setFlag(targetToken.actor, "ContagionSpell", { success: 0, failure: 0, saveDC: scope.macroActivity.save.dc.value });
    applyContagion(targetToken.actor);
  }
}

if (args[0] === "off") {
  // When off, clean up flags.
  DAE.unsetFlag(targetActor, "ContagionSpell");
}

if (args[0] === "each") {
  contagionSave(targetActor);
}
