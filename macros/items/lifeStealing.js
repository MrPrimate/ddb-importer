if (args[0].diceRoll === 20 &&
  args[0].itemData.data.attunement !== 1 &&
  args[0].otherDamageTotal > (actor.data.data.attributes.hp.temp ?? 0)
) {
  await actor.update({"data.attributes.hp.temp": args[0].otherDamageTotal});
}
