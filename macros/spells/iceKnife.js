const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const casterActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (lastArg.targets.length > 0) {
  let areaSpellData = foundry.utils.duplicate(lastArg.item);
  const damageDice = 1 + lastArg.spellLevel;
  delete areaSpellData.effects;
  delete areaSpellData.id;
  delete areaSpellData.flags["midi-qol"].onUseMacroName;
  delete areaSpellData.flags["midi-qol"].onUseMacroParts;
  if (foundry.utils.hasProperty(areaSpellData, "flags.itemacro")) delete areaSpellData.flags.itemacro;
  if (foundry.utils.hasProperty(areaSpellData, "flags.dae.macro")) delete areaSpellData.flags.dae.macro;
  areaSpellData.name = "Ice Knife: Explosion";
  areaSpellData.system.damage.parts = [[`${damageDice}d6[cold]`, "cold"]];
  areaSpellData.system.actionType = "save";
  areaSpellData.system.save.ability = "dex";
  areaSpellData.system.scaling = { mode: "level", formula: "1d6" };
  areaSpellData.system.preparation.mode = "atwill";
  areaSpellData.system.target.value = 99;

  foundry.utils.hasProperty(areaSpellData, "flags.midiProperties.magicdam", true);
  foundry.utils.hasProperty(areaSpellData, "flags.midiProperties.saveDamage", "nodam");
  foundry.utils.hasProperty(areaSpellData, "flags.midiProperties.bonusSaveDamage", "nodam");

  const areaSpell = new CONFIG.Item.documentClass(areaSpellData, { parent: casterActor });
  areaSpell.prepareData();
  areaSpell.prepareFinalAttributes();
  const target = canvas.tokens.get(lastArg.targets[0].id);
  const aoeTargets = MidiQOL
    .findNearby(null, target, 5, { includeIncapacitated: true })
    .filter((possible) => {
      const collisionRay = new Ray(target, possible);
      const collision = DDBImporter?.EffectHelper.checkCollision(collisionRay, ["sight"]);
      if (collision) return false;
      else return true;
    })
    .concat(target)
    .map((t) => t.document.uuid);

  const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions({ targets: aoeTargets });
  await MidiQOL.completeItemUse(areaSpell, config, options);
} else {
  ui.notifications.error("Ice Knife: No target selected: unable to automate burst effect.");
}
