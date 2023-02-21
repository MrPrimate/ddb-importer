const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const amount = args[1];
const currentTemp = Number.isInteger(targetActor.system.attributes.hp.temp)
  ? targetActor.system.attributes.hp.temp
  : 0;

async function rejuvenateTempHP(tempHP) {
  if (tempHP > currentTemp) {
    await DAE.setFlag(targetActor, "heroismSpell", tempHP);
    await targetActor.update({ "system.attributes.hp.temp": tempHP });
    ChatMessage.create({ content: `Heroism applies ${tempHP} temporary HP to ${targetActor.name}` });
  }
}

if (args[0] === "on") {
  await rejuvenateTempHP(amount);
}
if (args[0] === "off") {
  const flag = await DAE.getFlag(targetActor, "heroismSpell");
  if (flag) {
    const endTempHP = currentTemp > flag ? currentTemp - flag : null;
    await targetActor.update({ "system.attributes.hp.temp": endTempHP });
    await DAE.unsetFlag(targetActor, "heroismSpell");
  }
  ChatMessage.create({ content: `Heroism ends on ${targetActor.name}` });
}
if (args[0] === "each") {
  await rejuvenateTempHP(amount);
}
