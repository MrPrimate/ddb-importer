const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const tokenFromUuid = await fromUuid(lastArg.tokenUuid);
const targetToken = tokenFromUuid || token;

if (args[0].macroPass = 'isDamaged') {
  const attackerToken = fromUuidSync(args[0].tokenUuid).object;
  const defenderToken = args[0].options.token;
  const defenderActor = args[0].options.actor;
  if (!attackerToken || !defenderToken || !defenderActor) return;
  if (DDBImporter.EffectHelper.getDistance(attackerToken, defenderToken) > 5) return;
  const effect = defenderActor.effects.find((eff) => ["warm shield", "chill shield"].includes(eff.name.toLocaleLowerCase()));
  const damageType = effect.name.startsWith("Warm")
    ? 'fire'
    : 'cold';

  const itemCard = await item.displayCard({ createMessage: false });
  console.warn({
    item,
    lastArg,
    itemCard,
    effect,
  })
  await ChatMessage.create({
    user: game.user.id,
    content: `<b>Fire Shield: ${effect.name}</b><br>The attacker (${attackerToken.document.name}) suffers 2d8 ${damageType} damage`,
    speaker: ChatMessage.getSpeaker({ actor: defenderActor }),
  }, {});

  const roll = await new Roll(`2d8[${damageType}]`).toMessage({ flavor: "Fire Shield Damage", speaker: ChatMessage.getSpeaker({ scene: game.canvas?.scene, actor: defenderActor, token: defenderToken }) });
  await game.dice3d?.waitFor3DAnimationByMessageID(roll.id);
  const total = roll.rolls[0].result;
  await new MidiQOL.DamageOnlyWorkflow(
      defenderActor,
      defenderToken,
      total,
      damageType,
      [attackerToken.document],
      roll.rolls[0],
      { itemCardId: roll.id, damageList: args[0].damageList }
  );
}
