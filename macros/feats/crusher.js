if (args[0].tag !== "DamageBonus" && args[0].hitTargets == 0) return;
if (!["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType)) return;

const damageType = game.i18n.localize("bludgeoning");
if (args[0].damageDetail.some(i => i.type === damageType).length === 0 && args[0]?.defaultDamageType !== damageType) return;

const sourceActor = (await fromUuid(args[0].tokenUuid)).actor;

const sourceSize = Object.keys(CONFIG.DND5E.actorSizes).indexOf(args[0].actor.system.traits.size);
const targetSizes = args[0].hitTargets.map((target) => {
  return {
    name: target.name,
    size: Object.keys(CONFIG.DND5E.actorSizes).indexOf(target.actor.system.traits.size),
  };
});
const goodTargets = targetSizes.filter((t) => sourceSize >= ((t.size) - 1)).map((t) => t.name);
const badTargets = targetSizes.filter((t) => sourceSize < ((t.size) - 1)).map((t) => t.name);

let content = goodTargets.length > 0
  ? `<i>Once per turn</i> you may move one of the hit targets (${goodTargets.join(", ")}) 5 feet to an unoccupied space.`
  : "";

if (badTargets.length > 0) {
  if (goodTargets.length > 0) {
    content += `<br>You <b>cannot</b> move the following hit targets as they are too large  (${badTargets.join(", ")})`
  } else {
    content = `You can't move the hit targets (${badTargets.join(", ")}) because they are too large.`
  }
}

if (badTargets.length > 0 || goodTargets.length > 0) {
  await ChatMessage.create({
    user: game.user.id,
    content: `<b>Crusher</b><br>${content}`,
    speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
  }, {});
}
