if (args[0].diceRoll === 20 &&
  args[0].itemData.data.attunement !== 1 &&
  args[0].otherDamageTotal > (actor.system.attributes.hp.temp ?? 0)
) {
  await actor.update({"system.attributes.hp.temp": args[0].otherDamageTotal});
}
