// Midi-qol "on use"
const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const casterActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (lastArg.targets.length > 0) {
  let areaSpellData = duplicate(lastArg.item);
  const damageDice = 1 + lastArg.spellLevel;
  delete (areaSpellData.effects);
  delete (areaSpellData.id);
  delete (areaSpellData.flags["midi-qol"].onUseMacroName);
  delete (areaSpellData.flags["midi-qol"].onUseMacroParts);
  delete (areaSpellData.flags.itemacro);
  areaSpellData.name = "Ice Knife: Explosion";
  areaSpellData.system.damage.parts = [[`${damageDice}d6[cold]`, "cold"]];
  areaSpellData.system.actionType = "save";
  areaSpellData.system.save.ability = "dex";
  areaSpellData.system.scaling = { mode: "level", formula: "1d6" };
  areaSpellData.system.preparation.mode = "atwill";
  areaSpellData.system.target.value = 99;
  const areaSpell = new CONFIG.Item.documentClass(areaSpellData, { parent: casterActor });
  const target = canvas.tokens.get(lastArg.targets[0].id);
  const aoeTargets = await canvas.tokens.placeables.filter((placeable) =>
    canvas.grid.measureDistance(target, placeable) <= 9.5
    && !canvas.walls.checkCollision(new Ray(target.center, placeable.center), { mode: "any", type: "light" })
  ).map((placeable) => placeable.document.uuid);

  const options = {
    showFullCard: false,
    createWorkflow: true,
    targetUuids: aoeTargets,
    configureDialog: false,
    versatile: false,
    consumeResource: false,
    consumeSlot: false,
  };

  await MidiQOL.completeItemRoll(areaSpell, options);
} else {
  ui.notifications.error("Ice Knife: No target selected: unable to automate burst effect.");
}
