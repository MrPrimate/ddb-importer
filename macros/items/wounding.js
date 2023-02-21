//
const lastArg = args[args.length - 1];
let targetToken = await fromUuid(lastArg.tokenUuid);
const targetActor = targetToken?.actor;
const item = await fromUuid(lastArg.origin);

if (args[0] === "on") {

  if (!game.combat?.round) {
    ui.notifications.error("You can only use the wounding macro during combat.");
    return;
  }

  const sourceActor = item.parent;

  const combatTime = game.combat.round + game.combat.turn / 100;
  const lastTime = getProperty(sourceActor.flags, "midi-qol.woundedTime");
  lastArg.canWound = !game.combat || (combatTime !== lastTime);
  if (game.combat && lastArg.canWound && combatTime !== lastTime) {
    setProperty(sourceActor.flags, "midi-qol.woundedTime", combatTime)
  }
  if (!lastArg.canWound) {
    const stacks = getProperty(lastArg.efData, "flags.dae.stacks") || 1;
    const label = lastArg.efData.label.replace(/\s+\(\d*\)/, "") +` (${stacks - 1})`;
    Hooks.once("midi-qol.RollComplete", () => {
      targetActor.updateEmbeddedDocuments("ActiveEffect", [
        { _id: lastArg.efData._id, "flags.dae.stacks": stacks - 1, label }
      ]);
    });
  }
} else if (args[0] === "each") {
  const woundCount = getProperty(lastArg.efData, "flags.dae.stacks");
  if (!woundCount) return;
  const saveType = "con";
  const DC = 15;
  const flavor = `${CONFIG.DND5E.abilities[saveType]} DC${DC} ${item?.name || ""}`;
  const save = (await targetActor.rollAbilitySave(saveType, { flavor, fastForward: true })).total;
  if (save >= DC) {
    ChatMessage.create({content: "Wounding Save was made"});
    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: targetActor.uuid, effects: [lastArg.effectId] })
  } else {
    const damageRoll = await new Roll(`${woundCount}d4[necrotic]`).evaluate({ async: true });
    if (game.dice3d) game.dice3d.showForRoll(damageRoll);
    await new MidiQOL.DamageOnlyWorkflow(
      targetActor,
      targetToken,
      damageRoll.total,
      "necrotic",
      [targetToken],
      damageRoll,
      {
        flavor: `Failed Save for ${item.name}`,
        itemData: item?.toObject(),
        itemCardId: "new",
        useOther: true,
      }
    );
  }
} else if (args[0] === "off") {
  // do any clean up
}
