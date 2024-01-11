// pass in @spellLevel
const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on") {
  const dice = args[1];
  const chaMod = args[2];
  const curTemp = target.system.attributes.hp.temp;
  const damageRoll = await new CONFIG.Dice.DamageRoll(`${dice}[temphp] + ${chaMod}`).evaluate({ async: true });
  await MidiQOL.displayDSNForRoll(damageRoll, "damageRoll");
  const buf = damageRoll.total;
  ChatMessage.create({ content: `Rally granting ${buf} temp hp to ${target.name}.` });
  if (buf > curTemp) target.update({ "system.attributes.hp.temp": buf });
} else {
  target.update({ "system.attributes.hp.temp": 0 });
}
