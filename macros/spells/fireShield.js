const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const tokenFromUuid = await fromUuid(lastArg.tokenUuid);
const targetToken = tokenFromUuid || token;

function getShieldName(type) {
  return `Fire Shield (${type})`;
}

async function updateFireShield(type) {
  const itemCard = game.messages.get(args[0].itemCardId);
  const DIV = document.createElement('DIV');
  DIV.innerHTML = itemCard.content;

  const resistanceType = type == "warm" ? "cold" : "fire";
  console.warn({args, lastArg});
  const img = type === "warm"
    ? "icons/magic/defensive/shield-barrier-flaming-pentagon-red.webp"
    : "icons/magic/defensive/shield-barrier-flaming-pentagon-blue.webp";
  const effect = targetActor.effects.find((e) => e.origin === lastArg.itemUuid);
  const changes = [
    {
      key: "system.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 30,
      value: resistanceType,
    },
  ];
  const update = {
    img: img,
    changes: changes.concat(effect.changes),
  };
  console.warn("details", {
    effect,
    update,
  })
  if (effect.name) update.name = getShieldName(type);
  else update.label = getShieldName(type);
  await effect.update(update);
  DIV.querySelector('div.card-buttons').innerHTML = `${targetToken.name} gains resistance to ${resistanceType} damage`;
}


if (args[0].tag === 'OnUse') {
  new Dialog({
    title: "Warm or Cold Shield",
    content: "<p>Choose a shield type</p>",
    buttons: {
      warm: {
        label: "Warm",
        callback: async () => await updateFireShield("warm"),
      },
      cold: {
        label: "Cold",
        callback: async () => await updateFireShield("cold"),
      },
    },
  }).render(true);

} else if (args[0].macroPass = 'isDamaged') {
  const attackerToken = fromUuidSync(args[0].tokenUuid).object;
  const defenderToken = args[0].options.token;
  const defenderActor = args[0].options.actor;
  if (!attackerToken || !defenderToken || !defenderActor) return;
  if (DDBImporter.EffectHelper.getDistance(attackerToken, defenderToken) > 5) return;
  const dmgType = defenderActor.effects.find((eff) => (eff.name ?? eff.label).toLocaleLowerCase().includes('warm'))
    ? 'fire'
    : 'cold';
  const itemCard = await item.displayCard({ createMessage: false });
  const DIV = document.createElement('DIV');
  DIV.innerHTML = itemCard.content;
  DIV.querySelector('div.card-buttons').innerHTML = `The attacker suffers ${dmgType} damage`;
  const roll = await new Roll(`2d8[${dmgType}]`).toMessage({ flavor: DIV.innerHTML, speaker: ChatMessage.getSpeaker({ scene: game.canvas?.scene, actor: defenderActor, token: defenderToken }) });
  await game.dice3d?.waitFor3DAnimationByMessageID(roll.id);
  const total = roll.rolls[0].result;
  await new MidiQOL.DamageOnlyWorkflow(
      defenderActor,
      defenderToken,
      total,
      dmgType,
      [attackerToken.document],
      roll.rolls[0],
      { itemCardId: roll.id, damageList: args[0].damageList }
  );
}
