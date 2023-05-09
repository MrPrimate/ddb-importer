if (args[0].tag !== "DamageBonus" && args[0].hitTargets == 0) return;
if (!["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType)) return;

const damageType = game.i18n.localize("slashing");
if (args[0].damageDetail.some(i => i.type === damageType).length === 0 && args[0]?.defaultDamageType !== damageType) return;

const sourceActor = (await fromUuid(args[0].tokenUuid)).actor;

const content = `<i>Once per turn</i> you may reduce the speed one of the hit targets (${args[0].hitTargets.map((t) => t.name).join(", ")}) by 10ft until the start of your next turn.`;

await ChatMessage.create({
  user: game.user.id,
  content: `<b>Slasher</b><br>${content}`,
  speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
}, {});

