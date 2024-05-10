/* Squire of Solamnia: Precise Strike based on a macro by @Wheels#2393 */
async function refundUse(sourceActor, effectItem) {
  if (effectItem.system.uses?.value < effectItem.system.uses?.max) {
    const newValue = effectItem.system.uses.value + 1;
    const updateData = {
      _id: effectItem._id,
      system: { uses: { value: newValue }}
    };
    await sourceActor.updateEmbeddedDocuments("Item", [updateData]);

    console.log("Attacked missed! refunding resource as per feature rules.", updateData);
    await ChatMessage.create({
      user: game.user.id,
      content: `<b>${effectItem.name}</b><br>Attacked missed! Refunding use.`,
      speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
    }, {});
  }
}

if (args[0] === 'off') {
  const lastArg = args[args.length - 1];
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  const item = targetActor.items.find((i) => i.name === args[1]);
  if (item) {
    if (!item.getFlag("world", "preciseStrikeHit")) {
      await refundUse(workflow.actor, item);
    }
  }
  return;
} else if (args[0].tag === "DamageBonus") {
  try {
    const effectItem = await fromUuid(args[0].sourceItemUuid);
    if (args[0].hitTargets.length === 0) {
      return {};
    } else {
      await effectItem.setFlag("world", "preciseStrikeHit", true);
      return {
        damageRoll: new CONFIG.Dice.DamageRoll("1d8", {}, {critical: workflow.isCritical || workflow.rollOptions.critical}).formula,
        flavor: "Precision Strike"};
    }
  } catch (err) {
    console.error(`${args[0].itemData.name} - Squire of Solamnia: Precise Strike`, err);
  }
}
if (args[0].macroPass === 'postAttackRoll'
  && actor.effects.find((e) => e.name.includes(macroItem.name)
  && args[0].hitTargets.length === 0)
) {
  await refundUse(workflow.actor, scope.macroItem);
}
