const lastArg = args[args.length - 1];

console.warn({
  args,
  scope,
  item,
  lastArg,
  token,
  actor,
});

// macro will run on the caster, we want to ignore this
if (scope.effect.parent.uuid === actor.uuid) {
  console.debug(`Ignoring Spirit Guardians macro call for ${actor.name} as they are the caster`);
  return;
}


async function setCombatFlag(actor) {
  await DDBImporter.EffectHelper.setFlag(actor, "SpiritGuardiansTurn", {
    id: game.combat?.id ?? null,
    round: game.combat?.round ?? null,
    turn: game.combat?.turn ?? null
  });
}

if (args[0] === "on") {
  console.warn("on", { args, lastArg, scope, item });
  const turnFlag =  DDBImporter.EffectHelper.getFlag(actor, "SpiritGuardiansTurn") ?? {};

  if (turnFlag
    && turnFlag.id === game.combat?.id
    && turnFlag.turn === game.combat?.current?.turn
    && turnFlag.round === game.combat?.current?.round
  ) {
    console.log(`${actor.name} has taken the Spirit Guardians damage already this turn`);
  }

  // set flag for turn check
  await setCombatFlag(actor);
  // set flag to prevent end of turn roll
  await DDBImporter.EffectHelper.setFlag(actor, "SpiritGuardiansCalled", true);

  console.warn(`Running Spirit Guardians turn damage for entry on ${actor.name}`);
  // const sourceItem = await fromUuid(lastArg.origin);
  // const tokenOrActor = await fromUuid(lastArg.actorUuid);
  // const theActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  // const DAEItem = lastArg.efData.flags.dae.itemData;
  // const damageType = foundry.utils.getProperty(DAEItem, "flags.ddbimporter.damageType") || "radiant";

  // const itemData = foundry.utils.mergeObject(
  //   sourceItem.toObject(),
  //   {
  //     type: "weapon",
  //     effects: [],
  //     flags: {
  //       "midi-qol": {
  //         noProvokeReaction: true, // no reactions triggered
  //         onUseMacroName: null, //
  //       },
  //     },
  //     system: {
  //       equipped: true,
  //       actionType: "save",
  //       save: { dc: Number.parseInt(args[3]), ability: "wis", scaling: "flat" },
  //       damage: { parts: [[`${args[2]}d8`, damageType]] },
  //       "target.type": "self",
  //       properties: [],
  //       duration: { units: "inst", value: undefined },
  //       type: {
  //         value: "improv",
  //       },
  //     },
  //   },
  //   { overwrite: true, inplace: true, inPlace: true, insertKeys: true, insertValues: true },
  // );
  // itemData.system.target.type = "self";
  // foundry.utils.setProperty(itemData.flags, "autoanimations.killAnim", true);
  // const item = new CONFIG.Item.documentClass(itemData, { parent: theActor });
  // item.prepareData();
  // item.prepareFinalAttributes();
  // const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions();
  // await MidiQOL.completeItemUse(item, config, options);

  // DDBImporter.EffectHelper.setFlag(actor, "SpiritGuardiansCalled", true);
}

if (args[0] === "each") {
  console.warn("Each", { args, lastArg, scope, item });
  // creatures turn set flags to take end of turn damage
  await DDBImporter.EffectHelper.setFlag(actor, "SpiritGuardiansCalled", false);
}


if (args[0] === "off") {
  // DDBImporter.EffectHelper.unsetFlag(actor, "SpiritGuardiansCalled");
}
