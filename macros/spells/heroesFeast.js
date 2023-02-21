const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const amount = args[1];

async function updateHP(max, current) {
  return targetActor.update({ "system.attributes.hp.max": max, "system.attributes.hp.value": current });
}

// Update HP and Max HP to roll formula, save result as flag
if (args[0] === "on") {
  const hpMax = targetActor.system.attributes.hp.max;
  const hp = targetActor.system.attributes.hp.value;
  await updateHP(hpMax + amount, hp + amount);
  ChatMessage.create({ content: `${targetActor.name} gains ${amount} Max HP` });
  await DAE.setFlag(targetActor, "heroesFeastSpell", amount);
}

// Remove Max Hp and reduce HP to max if needed
if (args[0] === "off") {
  const amountOff = await DAE.getFlag(targetActor, "heroesFeastSpell");
  const hpMax = targetActor.system.attributes.hp.max;
  const newHpMax = hpMax - amountOff;
  const hp = targetActor.system.attributes.hp.value > newHpMax ? newHpMax : targetActor.system.attributes.hp.value;
  await updateHP(newHpMax, hp);
  ChatMessage.create({ content: targetActor.name + "'s Max HP returns to normal" });
  DAE.unsetFlag(targetActor, "heroesFeastSpell");
}
