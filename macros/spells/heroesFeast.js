console.warn("midi", {
  scope,
  item,
  args
})

if (scope.rolledActivity?.type !== "heal") return;

if (workflow.targets.size === 0) {
  logger.warn("No targets found");
  ui.notifications.warn(`Please Target up to 12 creatures!`);
  item.update({ "system.uses.spent": item.system.uses.spent + extraSpent });
  return;
}

await DDBImporter.EffectHelper.wait(500);

for (const damageData of scope.workflow.damageList) {
  const targetActor = await fromUuid(damageData.actorUuid);
  const originalEffect = targetActor.effects.find((a) => a.origin === item.uuid);

  const effect = {
    _id: originalEffect._id,
    changes: originalEffect.changes.map((c) => {
      if (c.key !== "system.attributes.hp.tempmax") return c;
      c.value = damageData.totalDamage;
      return c;
    }),
  };
  await DDBImporter.socket.executeAsGM("updateEffects", {
    actorUuid: damageData.actorUuid,
    updates: [effect],
  });

  const currHP = targetActor.system.attributes.hp.value;

  await MidiQOL.socket().executeAsGM("updateActor", {
    actorUuid: damageData.actorUuid,
    actorData: { "system.attributes.hp.value": currHP + damageData.totalDamage + damageData.hpDamage },
  });

}

// if (workflow.targets.size > 1) {
//   const extraSpent = workflow.targets.size - 1;
//   item.update({ "system.uses.spent": item.system.uses.spent + extraSpent });
// }
