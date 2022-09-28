const lastArg = args[args.length - 1];

if (lastArg.failedSaveUuids.length > 0) {
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const casterActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  const casterToken = await fromUuid(lastArg.tokenUuid);
  const damageType = "necrotic";
  const targets = lastArg.failedSaves.map((fs) => canvas.tokens.get(fs.id));

  // assuming single target for spell
  const damageDiceType = targets[0].actor.system.attributes.hp.max != targets[0].actor.system.attributes.hp.value ? 12 : 8;
  const casterLevel = casterActor.type === "character" ? casterActor.system.details.level : casterActor.system.details.spellLevel;
  const damageDiceNum = Math.floor((casterLevel + 1) / 6) + 1;
  const damageRoll = await new Roll(`${damageDiceNum}d${damageDiceType}[${damageType}]`).evaluate({ async: true });
  if (game.dice3d) game.dice3d.showForRoll(damageRoll);
  await new MidiQOL.DamageOnlyWorkflow(
    casterActor,
    casterToken,
    damageRoll.total,
    damageType,
    targets,
    damageRoll,
    {
      flavor: `(${CONFIG.DND5E.damageTypes[damageType]})`,
      itemCardId: lastArg.itemCardId,
      itemData: lastArg.item,
      isCritical: lastArg.isCritical,
    }
  );
}
