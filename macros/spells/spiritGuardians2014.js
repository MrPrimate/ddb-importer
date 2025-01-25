const lastArg = args[args.length - 1];

// console.warn({
//   args,
//   scope,
//   item,
//   lastArg,
//   token,
//   actor,
// });

// macro will run on the caster, we want to ignore this
if (scope.macroActivity.item.actor.uuid === actor.uuid) {
  console.debug(`Ignoring ${scope.macroActivity.item.name} macro call for ${actor.name} as they are the caster`);
  return;
}

async function setCombatFlag(actor) {
  await DDBImporter.EffectHelper.setFlag(actor, "SpiritGuardiansTurn", {
    id: game.combat?.id ?? null,
    round: game.combat?.round ?? null,
    turn: game.combat?.turn ?? null
  });
}

async function addOvertimeEffect(name = "Spirit Guardians", actorUuid, damageType = "radiant") {

  const overtimeOptions = [
    `label=${name} (Start of Turn)`,
    `turn=start`,
    "damageRoll=(@spellLevel)d8",
    `damageType=${damageType}`,
    "saveRemove=false",
    "saveDC=@attributes.spelldc",
    "saveAbility=wis",
    "saveDamage=halfdamage",
    "killAnim=true",
  ];

  await DDBImporter.socket.executeAsGM("updateEffects", {
    actorUuid,
    updates: [
      { _id: scope.effect._id,
        changes: scope.effect.changes.concat([
          {
            key: "flags.midi-qol.overtime",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 20,
            value: overtimeOptions.join(","),
          }
        ]),
      },
    ],
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
    return;
  }

  // set flag for turn check
  await setCombatFlag(actor);
  // set flag to prevent end of turn roll
  await DDBImporter.EffectHelper.setFlag(actor, "SpiritGuardiansCalled", true);

  // console.warn(`Running ${scope.macroActivity.item.name} turn damage for entry on ${actor.name}`);

  const alignment = foundry.utils.getProperty(scope, "macroActivity.actor.system.details.alignment")?.toLowerCase();

  const damageTypes = [];
  if (alignment.includes("evil")) {
    damageTypes.push("necrotic");
  } else if (alignment) {
    damageTypes.push("radiant");
  }

  await addOvertimeEffect(scope.macroActivity.item.name,actor.uuid, damageTypes.length > 0 ? damageTypes[0] : "radiant");

  // const originDocument = await fromUuid(lastArg.origin);
  const workflowItemData = DDBImporter.EffectHelper.documentWithFilteredActivities({
    document: scope.macroActivity.item,
    activityTypes: ["save"],
    parent: scope.macroActivity.item.actor,
    clearEffectFlags: true,
    renameDocument: `${scope.macroActivity.item.name}: Save vs Damage`,
    killAnimations: true,
    filterActivityDamageTypes: damageTypes,
  });



  await DDBImporter.EffectHelper.rollMidiItemUse(workflowItemData, {
    targets: [token.document.uuid],
    slotLevel: scope.effect.flags["midi-qol"].castData.castLevel,
    scaling: scope.effect.flags["midi-qol"].castData.castLevel - scope.effect.flags["midi-qol"].castData.baseLevel,
  });

}

// runs at start of turn after overTime effect. add flags to mark turn damage taken
if (args[0] === "each" && lastArg.turn === "startTurn") {
  // console.warn("Each startTurn", { args, lastArg, scope, item });
  // creatures take damage at begining of turn
  // set flag to prevent damage if moving in and out of aura
  await setCombatFlag(actor);
  await DDBImporter.EffectHelper.setFlag(actor, "SpiritGuardiansCalled", true);
}

if (args[0] === "each" && lastArg.turn === "endTurn") {
  // console.warn("Each endTurn", { args, lastArg, scope, item });
  await DDBImporter.EffectHelper.setFlag(actor, "SpiritGuardiansCalled", false);
}
