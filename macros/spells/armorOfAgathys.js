if (args.length !== 3 || args[0] !== "onUpdateActor") return;
const lastArg = args[2];
const spellLevel = args[1];
const message = game.messages.contents.findLast((i) =>
  i.content.includes('<div class="dnd5e chat-card item-card midi-qol-item-card"')
);
let workflow = MidiQOL.Workflow.getWorkflow(message.flags["midi-qol"].workflowId);
const validAttacks = ["mwak", "msak"];
if (
  validAttacks.includes(workflow.item?.system?.actionType) &&
  workflow.hitTargets?.has(lastArg.sourceToken)
) {
  const attackerToken = workflow.token;
  const damageAmount = parseInt(spellLevel) * 5;
  const damageType = "cold";
  const messageContent = `Armor of Agathys reactive damage: ${damageAmount} (${damageType})`;
  await ChatMessage.create({ content: messageContent });
  console.log(attackerToken);
  await MidiQOL.applyTokenDamage(
    [{ type: `${damageType}`, damage: damageAmount }],
    damageAmount,
    new Set([attackerToken]),
    item,
    new Set(),
    { forceApply: false }
  );
}
if (lastArg.updates.system.attributes.hp.temp <= 0) {
  const effectId = lastArg.sourceActor.effects.find((eff) => (eff.name ?? eff.label) === "Armor of Agathys").id;
  await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: lastArg.actorUuid, effects: [effectId] });
}
