// pass in @spellLevel
const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on") {
  const dice = args[1];
  const chaMod = args[2];
  const curTemp = target.system.attributes.hp.temp;
  const damageRoll = await new Roll(`${dice}[temphp] + ${chaMod}`).evaluate({ async: true });
  if (game.dice3d) game.dice3d.showForRoll(damageRoll, game.users.get(options.userId));
  const buf = damageRoll.total;
  if (buf > curTemp) target.update({ "system.attributes.hp.temp": buf });
} else {
  target.update({ "system.attributes.hp.temp": 0 });
}
