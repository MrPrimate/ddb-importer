import { logger, utils } from "../../lib/_module.mjs";
// import DDBEffectHelper from "../DDBEffectHelper.mjs";


async function setCombatFlag(actor, flagName) {
  await DDBImporter.EffectHelper.setFlag(actor, flagName, {
    id: game.combat?.id ?? null,
    round: game.combat?.round ?? null,
    turn: game.combat?.turn ?? null,
  });
}

async function addOvertimeEffect({ name, actorUuid, damageType, damageRoll, flagName, ability, effect } = {}) {

  const overtimeOptions = [
    `label=${name} (End of Turn)`,
    `turn=end`,
    `damageRoll=${damageRoll}`,
    `damageType=${damageType}`,
    "saveRemove=false",
    "saveDC=@attributes.spelldc",
    `saveAbility=${ability}`,
    "saveDamage=halfdamage",
    "killAnim=true",
    `applyCondition=!flags.ddbihelpers.${flagName}`,
    `macroToCall=function.DDBImporter.effects.AuraAutomations.ActorDamageOnEntry`,
  ];

  await DDBImporter.socket.executeAsGM("updateEffects", {
    actorUuid,
    updates: [
      {
        _id: effect._id,
        changes: effect.changes.concat([
          {
            key: "flags.midi-qol.overtime",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 20,
            value: overtimeOptions.join(","),
          },
        ]),
      },
    ],
  });
}


export default async function damageOnEntry({
  // eslint-disable-next-line no-unused-vars
  speaker, actor, token, character, item, rolledItem, macroItem,
  // eslint-disable-next-line no-unused-vars
  args, scope, workflow,
} = {}) {


  const lastArg = args[args.length - 1];

  const itemName = scope.macroActivity.item.name;
  const baseName = utils.nameString(itemName);
  const flagNameTurn = `${baseName}Turn`;
  const flagNameCalled = `${baseName}Called`;

  console.warn({
    args,
    scope,
    item,
    lastArg,
    token,
    actor,
    baseName,
    itemName,
    flagNameTurn,
    flagNameCalled,
  });

  // macro will run on the caster, we want to ignore this
  if (scope.macroActivity.item.actor.uuid === actor.uuid) {
    logger.debug(`Ignoring ${itemName} macro call for ${actor.name} as they are the caster`);
    return;
  }

  if (args[0] === "on") {
    // console.warn("on", { args, lastArg, scope, item });
    const turnFlag = DDBImporter.EffectHelper.getFlag(actor, flagNameTurn) ?? {};

    if (turnFlag
      && turnFlag.id === game.combat?.id
      && turnFlag.turn === game.combat?.current?.turn
      && turnFlag.round === game.combat?.current?.round
    ) {
      logger.log(`${actor.name} has taken the ${itemName} damage already this turn`);
      return;
    }

    // set flag for turn check
    await setCombatFlag(actor);
    // set flag to prevent end of turn roll
    await DDBImporter.EffectHelper.setFlag(actor, flagNameCalled, true);

    // const originDocument = await fromUuid(lastArg.origin);
    const workflowItemData = DDBImporter.EffectHelper.documentWithFilteredActivities({
      document: scope.macroActivity.item,
      activityTypes: ["save"],
      parent: scope.macroActivity.item.actor,
      clearEffectFlags: true,
      renameDocument: `${itemName}: Save vs Damage`,
      killAnimations: true,
    });

    const saveActivity = workflowItemData.system.activities.first();
    const damageTypes = saveActivity.damage.parts.types;

    const damageArray = [];

    for (const damagePart of saveActivity.damage.parts) {
      if (damagePart.custom.enabled) {
        damageArray.push(damagePart.custom.formula);
      } else {
        damageArray.push(`${damagePart.number}d${damagePart.denomination}`);
        if (damagePart.bonus && damagePart.bonus !== "") {
          damageArray.push(damagePart.bonus);
        }
      }
    }

    await addOvertimeEffect({
      effect: scope.effect,
      name: itemName,
      actorUuid: actor.uuid,
      damageType: damageTypes.length > 0 ? damageTypes[0] : null,
      damageRoll: damageArray.join("+").removeAll(" "),
      flagName: flagNameCalled,
      ability: saveActivity.save.ability.first(),
    });

    await DDBImporter.EffectHelper.rollMidiItemUse(workflowItemData, {
      targets: [token.document.uuid],
      slotLevel: scope.effect.flags["midi-qol"].castData.castLevel,
      scaling: scope.effect.flags["midi-qol"].castData.castLevel - scope.effect.flags["midi-qol"].castData.baseLevel,
    });
  }

  // at start of each turn, reset flags
  if (args[0] === "each" && lastArg.turn === "startTurn") {
    // console.warn("Each startTurn", { args, lastArg, scope, item });
    await DDBImporter.EffectHelper.setFlag(actor, flagNameCalled, false);
  }

  // runs at end of turn after overTime effect. add flags to mark turn damage taken
  if (args[0] === "each" && lastArg.turn === "endTurn") {
    // console.warn("Each endTurn", { args, lastArg, scope, item });
    await setCombatFlag(actor);
    await DDBImporter.EffectHelper.setFlag(actor, flagNameCalled, true);
  }


}
