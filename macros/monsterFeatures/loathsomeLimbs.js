
const getEffects = (name, targetActor) => {
  return targetActor.effects.filter((e) => e.name?.includes(name)).length;
};

const generateLimbEffect = (roll, targetActor) => {
  if (roll.rolls[0].total < 9) {
    const name = 'Severed Leg';
    if (getEffects(name, targetActor) >= 2) return;
    ChatMessage.create({ content: `${targetActor.name}'s has severed a leg` });
    return { name, stackable: 'count', changes: [{ key: 'system.attributes.movement.walk', mode: 2, value: -5 }] };
  } else if (roll.rolls[0].total < 17) {
    const name = 'Severed Arm';
    if (getEffects(name, targetActor) >= 2) return;
    ChatMessage.create({ content: `${targetActor.name}'s has severed an arm` });
    return { name, stackable: 'count', changes: [{ key: 'flags.midi-qol.disadvantage.attack.all', mode: 0, value: 1 }] };
  } else {
    const name = 'Decapitated';
    if (getEffects(name, targetActor) >= 1) return;
    ChatMessage.create({ content: `${targetActor.name}'s has been decapitated` });
    const change = DDBImporter.EffectHelper.generateStatusEffectChange("Blinded", 20);
    return { name, stackable: 'noneName', changes: [change] };
  }
};


if (['slashing', 'bludgeoning'].some((dt) => {
  const { damage, damageMultiplier } = workflow.damageItem.damageDetail[0].find((d) => d.type === dt) || {};
  if (damage && damageMultiplier && damage * damageMultiplier > 5) return true;
  else return false;
})) {
  const roll = await new Roll('1d20').toMessage({ flavor: 'You scored an especially gnarly hit against this zombie!' });
  const targetActor = workflow.targets.first().actor;
  const stacked = generateLimbEffect(roll, targetActor);

  const effectData = {
    name: stacked.name,
    changes: stacked.changes,
    img: item.img,
    flags: { dae: { stackable: stacked.stackable } },
    statuses: [stacked.name],
    origin: item.uuid
  };
  await MidiQOL.socket().executeAsGM('createEffects', { actorUuid: workflow.targets.first().actor.uuid, effects: [effectData] });
}
