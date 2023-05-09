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

if (["off"].includes(args[0])) {
  const lastArg = args[args.length - 1];
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  const item = targetActor.items.find((i) => i.name === args[1]);
  if (item) {
    if (!item.getFlag("world", "preciseStrikeHit")) {
      await refundUse(targetActor, item);
    }
  }
  return;
} else if (args[0].tag === "DamageBonus") {
  try {
    const effectItem = await fromUuid(args[0].sourceItemUuid);
    if (args[0].hitTargets.length === 0) {
      //if player misses the target, refund the resource as per feature description
      if (effectItem) {
        await refundUse(args[0].actor, effectItem);
      }
      return {};
    } else {
      await effectItem.setFlag("world", "preciseStrikeHit", true);
      return { damageRoll: "1d8", flavor: effectItem?.name };
    }
  } catch (err) {
    console.error(`${args[0].itemData.name} - Squire of Solamnia: Precise Strike ${version}`, err);
  }
}
