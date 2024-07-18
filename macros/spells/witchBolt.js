async function sustainedDamage({ options, damageType, damageDice, sourceItem, caster }) {
  const damageRoll = await new CONFIG.Dice.DamageRoll(`${damageDice}[${damageType}]`).evaluate({ async: true });
  if (game.dice3d) game.dice3d.showForRoll(damageRoll, game.users.get(options.userId));

  // console.warn({ options, damageType, damageDice, sourceItem, caster });
  const targets = await Promise.all(options.targets.map(async (uuid) => {
    const tok = await fromUuid(uuid);
    return tok.object;
  }));
  const casterToken = await fromUuid(options.sourceUuid);
  const itemData = sourceItem.toObject();
  itemData.system.properties = DDBImporter?.EffectHelper.removeFromProperties(itemData.system.properties, "concentration") ?? [];
  itemData.effects = [];
  delete itemData._id;

  const workflow = await new MidiQOL.DamageOnlyWorkflow(
    caster,
    casterToken,
    damageRoll.total,
    damageType,
    targets,
    damageRoll,
    {
      flavor: `(${CONFIG.DND5E.damageTypes[damageType].label})`,
      itemCardId: "new",
      itemData,
      isCritical: false,
    }
  );
}

async function cancel(caster) {
  // Remove concentration and the effect causing it since the effect has been used
  const concentration = MidiQOL.getConcentrationEffect(macroData.actor);

  if (concentration) {
    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: caster.uuid, effects: [concentration.id] });
  }
  await DAE.unsetFlag(caster, "witchBoltSpell");
}

const lastArg = args[args.length - 1];
const damageDice = "1d12";
const damageType = "lightning";

if (args[0].macroPass === "postActiveEffects") {
  if (args[0].hitTargetUuids.length === 0) return {}; // did not hit anyone

  const effectData = [{
    label: "WitchBolt (Concentration)",
    name: "WitchBolt (Concentration)",
    img: args[0].item.img,
    duration: { rounds: 10, startTime: game.time.worldTime },
    origin: args[0].item.uuid,
    changes: [DDBImporter.lib.DDBMacros.generateMacroChange({ macroType: "spell", macroName: "witchBolt.js", document: { name: "Witch Bolt" } })],
    disabled: false,
    "flags.dae.macroRepeat": "startEveryTurn",
  }];

  const options = {
    targets: args[0].hitTargetUuids,
    sourceUuid: args[0].tokenUuid,
    distance: args[0].item.system.range.value,
    userId: game.userId,
  };

  await DAE.setFlag(args[0].actor, "witchBoltSpell", options);

  // console.warn("WitchBolt", {options, effectData, args, actor: args[0].actor});
  await args[0].actor.createEmbeddedDocuments("ActiveEffect", effectData);
} else if (args[0] == "off") {
  const sourceItem = await fromUuid(lastArg.origin);
  const caster = sourceItem.parent;
  DAE.unsetFlag(caster, "witchBoltSpell");
} else if (args[0] == "each") {
  const sourceItem = await fromUuid(lastArg.origin);
  const caster = sourceItem.parent;
  const options = DAE.getFlag(caster, "witchBoltSpell");
  // console.warn("on each", {
  //   options,
  //   sourceItem,
  //   lastArg,
  //   caster,
  // })
  const isInRange = await DDBImporter?.EffectHelper.checkTargetInRange(options);
  if (isInRange) {
    const userIds = Object.entries(caster.ownership).filter((k) => k[1] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER).map((k) => k[0]);
    await ChatMessage.create({
      content: `<p>${caster.name} may use their action to sustain Witch Bolt. Asking them now...</p><br>`,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      speaker: caster.uuid,
      whisper: game.users.filter((u) => userIds.includes(u.id) || u.isGM),
    });
    const result = await DDBImporter.DialogHelper.AskUserButtonDialog(options.userId, {
        buttons: [
          { label: "Yes, damage!", value: true},
          { label: "No, end concentration", value: false }
        ],
        title: "Witch Bolt",
        content: "<p>Use action to sustain Witch Bolt?</p>"
      },
      'column');
    // console.warn("result", result);
    if (result) {
      sustainedDamage({options, damageType, damageDice, sourceItem, caster} );
    } else {
      cancel(caster);
    }
  }
}
