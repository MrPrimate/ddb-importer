if(!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
}

const lastArg = args[args.length - 1];

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

function getHighestAbility(actor, abilities) {
  if (typeof abilities === "string") {
    return abilities;
  } else if (Array.isArray(abilities)) {
    return abilities.reduce((prv, current) => {
      if (actor.system.abilities[current].value > actor.system.abilities[prv].value) return current;
      else return prv;
    }, abilities[0]);
  }
}

function getCantripDice(actor) {
  const level = actor.type === "character" ? actor.system.details.level : actor.system.details.cr;
  return 1 + Math.floor((level + 1) / 6);
}


async function attemptRemoval(targetToken, condition, item) {
  if (game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.document.uuid)) {
    new Dialog({
      title: `Use action to attempt to remove ${condition}?`,
      buttons: {
        one: {
          label: "Yes",
          callback: async () => {
            const caster = item.parent;
            const saveDc = caster.system.attributes.spelldc;
            const removalCheck = item.system.flags.ddbimporter.effect.removalCheck;
            const removalSave = item.system.flags.ddbimporter.effect.removalSave;
            const ability = removalCheck ? getHighestAbility(targetToken.actor.data, removalCheck) : getHighestAbility(targetToken.actor.data, removalSave);
            const type = removalCheck ? "check" : "save";
            const flavor = `${condition} (via ${item.name}) : ${CONFIG.DND5E.abilities[ability]} ${type} vs DC${saveDc}`;
            const rollResult = removalCheck
              ? (await targetToken.actor.rollAbilityTest(ability, { flavor })).total
              : (await targetToken.actor.rollAbilitySave(ability, { flavor })).total;

            if (rollResult >= saveDc) {
              game.dfreds.effectInterface.removeEffect({ effectName: condition, uuid: targetToken.document.uuid });
            } else {
              if (rollResult < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the ${type} for ${item.name}, still has the ${condition} condition.` });
            }
          },
        },
        two: {
          label: "No",
          callback: () => {},
        },
      },
    }).render(true);
  }
}

async function applyCondition(condition, targetToken, item, itemLevel) {
  if (!game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.document.uuid)) {
    const caster = item.parent;
    const workflowItemData = duplicate(item.data);
    workflowItemData.system.target = { value: 1, units: "", type: "creature" };
    workflowItemData.system.save.ability = item.flags.ddbimporter.effect.save;
    workflowItemData.system.components.concentration = false;
    workflowItemData.system.level = itemLevel;
    workflowItemData.system.duration = { value: null, units: "inst" };
    workflowItemData.system.target = { value: null, width: null, units: "", type: "creature" };
    workflowItemData.system.preparation.mode = "atwill";
    setProperty(workflowItemData, "flags.itemacro", {});
    setProperty(workflowItemData, "flags.midi-qol", {});
    setProperty(workflowItemData, "flags.dae", {});
    setProperty(workflowItemData, "effects", []);
    delete workflowItemData._id;
    workflowItemData.name = `${workflowItemData.name}: ${item.name} Condition save`;
    // console.warn("workflowItemData", workflowItemData);

    const saveTargets = [...game.user?.targets].map((t )=> t.id);
    game.user.updateTokenTargets([targetToken.id]);
    const saveItem = new CONFIG.Item.documentClass(workflowItemData, { parent: caster });
    const options = { showFullCard: false, createWorkflow: true, configureDialog: true };
    const result = await MidiQOL.completeItemRoll(saveItem, options);

    game.user.updateTokenTargets(saveTargets);
    const failedSaves = [...result.failedSaves];
    if (failedSaves.length > 0) {
      await game.dfreds.effectInterface.addEffect({ effectName: condition, uuid: failedSaves[0].document.uuid });
    }

    return result;
  }
}

async function attachSequencerFileToTemplate(templateUuid, sequencerFile, originUuid) {
  if (game.modules.get("sequencer")?.active) {
    if (Sequencer.Database.entryExists(sequencerFile)) {
      console.debug(`Trying to apply sequencer effect (${sequencerFile}) to ${templateUuid} from ${originUuid}`, sequencerFile);
      const template = await fromUuid(templateUuid);
      new Sequence()
      .effect()
        .file(Sequencer.Database.entryExists(sequencerFile))
        .size({
          width: canvas.grid.size * (template.data.width / canvas.dimensions.distance),
          height: canvas.grid.size * (template.data.width / canvas.dimensions.distance),
        })
        .persist(true)
        .origin(originUuid)
        .belowTokens()
        .opacity(0.5)
        .attachTo(template, { followRotation: true })
        .stretchTo(template, { attachTo: true})
      .play();
    }
  }
}


async function rollItemDamage(targetToken, itemUuid, itemLevel) {
  const item = await fromUuid(itemUuid);
  const caster = item.parent;
  const isCantrip = item.flags.ddbimporter.effect.isCantrip;
  const damageDice = item.flags.ddbimporter.effect.dice;
  const damageType = item.flags.ddbimporter.effect.damageType;
  const saveAbility = item.flags.ddbimporter.effect.save;
  const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);
  const scalingDiceArray = item.system.scaling.formula.split("d");
  const scalingDiceNumber = itemLevel - item.system.level;
  const upscaledDamage =  isCantrip
    ? `${getCantripDice(caster.data)}d${scalingDiceArray[1]}[${damageType}]`
    : scalingDiceNumber > 0 ? `${scalingDiceNumber}d${scalingDiceArray[1]}[${damageType}] + ${damageDice}` : damageDice;
  const damageRoll = await new Roll(upscaledDamage).evaluate({ async: true });
  if (game.dice3d) game.dice3d.showForRoll(damageRoll);
  const workflowItemData = duplicate(item.data);
  workflowItemData.system.target = { value: 1, units: "", type: "creature" };
  workflowItemData.system.save.ability = saveAbility;
  workflowItemData.system.components.concentration = false;
  workflowItemData.system.level = itemLevel;
  workflowItemData.system.duration = { value: null, units: "inst" };
  workflowItemData.system.target = { value: null, width: null, units: "", type: "creature" };

  setProperty(workflowItemData, "flags.itemacro", {});
  setProperty(workflowItemData, "flags.midi-qol", {});
  setProperty(workflowItemData, "flags.dae", {});
  setProperty(workflowItemData, "effects", []);
  delete workflowItemData._id;
  workflowItemData.name = `${workflowItemData.name}: Turn Entry Damage`;
  // console.warn("workflowItemData", workflowItemData);

  await new MidiQOL.DamageOnlyWorkflow(
    caster,
    casterToken,
    damageRoll.total,
    damageType,
    [targetToken],
    damageRoll,
    {
      flavor: `(${CONFIG.DND5E.damageTypes[damageType]})`,
      itemCardId: "new",
      itemData: workflowItemData,
      isCritical: false,
    }
  );
}

if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  const safeName = lastArg.itemData.name.replace(/\s|'|\.|’/g, "_");
  const dataTracker = {
    randomId: randomID(),
    targetUuids: lastArg.targetUuids,
    startRound: game.combat.round,
    startTurn: game.combat.turn,
    spellLevel: lastArg.spellLevel,
  };

  const item = await fromUuid(lastArg.itemUuid);
  // await item.update(dataTracker);
  await DAE.unsetFlag(item, `${safeName}Tracker`);
  await DAE.setFlag(item, `${safeName}Tracker`, dataTracker);

  const ddbEffectFlags = lastArg.item.flags.ddbimporter?.effect;
  if (ddbEffectFlags) {
    const sequencerFile = ddbEffectFlags.sequencerFile;
    if (sequencerFile) {
      await attachSequencerFileToTemplate(lastArg.templateUuid, sequencerFile, lastArg.itemUuid)
    }
    if (ddbEffectFlags.isCantrip) {
      const cantripDice = getCantripDice(lastArg.actor);
      args[0].spellLevel = cantripDice;
      ddbEffectFlags.cantripDice = cantripDice;
      let newEffects = args[0].item.effects.map((effect) => {
        effect.changes = effect.changes.map((change) => {
          change.value = change.value.replace("@cantripDice", cantripDice)
          return change;
        });
        return effect;
      });
      args[0].item.effects = duplicate(newEffects);
      args[0].itemData.effects = duplicate(newEffects);
    }
    const template = await fromUuid(lastArg.templateUuid);
    await template.update({"flags.effect": ddbEffectFlags});

    if (ddbEffectFlags.applyImmediate) {
      console.debug("Applying immediate effect");
      await wait(500);
      const condition = ddbEffectFlags.condition;
      for (const token of lastArg.failedSaves) {
        if (!game.dfreds.effectInterface.hasEffectApplied(condition, token.actor.uuid)) {
          console.debug(`Applying ${condition} to ${token.name}`);
          await game.dfreds.effectInterface.addEffect({ effectName: condition, uuid: token.actor.uuid });
        }
      };
    }
  }

  console.debug("ItemMacro: Pre-apply finised, applying effect to template")

  return await AAhelpers.applyTemplate(args);

} else if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
  if (lastArg.item.flags.ddbimporter?.effect?.applyImmediate) {
    const condition = lastArg.item.flags.ddbimporter.effect.condition;
    for (const token of lastArg.failedSaves) {
      if (!game.dfreds.effectInterface.hasEffectApplied(condition, token.actor.uuid)) {
        console.debug(`Applying ${condition} to ${token.name}`);
        await game.dfreds.effectInterface.addEffect({ effectName: condition, uuid: token.actor.uuid });
      }
    };
  }
} else if (args[0] == "on" || args[0] == "each") {
  const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
  const item = await fromUuid(lastArg.efData.origin);
  const ddbEffectFlags = item.flags.ddbimporter.effect;
  // sometimes the round info has not updated, so we pause a bit
  if (args[0] == "each") await wait(500);
  const targetItemTracker = DAE.getFlag(item.parent, `${safeName}Tracker`);
  const originalTarget = targetItemTracker.targetUuids.includes(lastArg.tokenUuid);
  const target = canvas.tokens.get(lastArg.tokenId);
  const targetTokenTrackerFlag = DAE.getFlag(target, `${safeName}Tracker`);
  const targetedThisCombat = targetTokenTrackerFlag && targetItemTracker.randomId === targetTokenTrackerFlag.randomId;
  const targetTokenTracker = targetedThisCombat
    ? targetTokenTrackerFlag
    : {
      randomId: targetItemTracker.randomId,
      round: game.combat.round,
      turn: game.combat.turn,
      hasLeft: false,
      condition: ddbEffectFlags.condition,
    };

  const castTurn = targetItemTracker.startRound === game.combat.round && targetItemTracker.startTurn === game.combat.turn;
  const isLaterTurn = game.combat.round > targetTokenTracker.round || game.combat.turn > targetTokenTracker.turn;
  const everyEntry = hasProperty(item.data, "flags.ddbimporter.effect.everyEntry")
    ? item.flags.ddbimporter.effect.everyEntry
    : false;

  // if:
  // not cast turn, and not part of the original target
  // AND one of the following
  // not original template and have not yet had this effect applied this combat OR
  // has been targeted this combat, left and re-entered effect, and is a later turn

  const autoDamageIfCondition = hasProperty(ddbEffectFlags, "autoDamageIfCondition") ? ddbEffectFlags.autoDamageIfCondition : false;
  const hasConditionStart = game.dfreds.effectInterface.hasEffectApplied(targetTokenTracker.condition, target.actor.uuid);
  const applyAutoConditionDamage = autoDamageIfCondition && hasConditionStart;

  if (ddbEffectFlags.conditionEffect && !hasConditionStart) {
    if (castTurn && originalTarget) {
      console.debug(`Token ${target.name} is part of the original target for ${item.name}`);
    } else if (everyEntry || !targetedThisCombat || (targetedThisCombat && isLaterTurn)) {
      console.debug(`Token ${target.name} is targeted for immediate save vs condition with ${item.name}, using the following factors`, { originalTarget, castTurn, targetedThisCombat, targetTokenTracker, isLaterTurn });
      targetTokenTracker.hasLeft = false;
      await applyCondition(targetTokenTracker.condition, target, item, targetItemTracker.spellLevel);
    } else {
      console.debug(`Token ${target.name} has not evaluated for condition application`);
    }
  }
  if (ddbEffectFlags.damageEffect) {
    if (castTurn && originalTarget) {
      console.debug(`Token ${target.name} is part of the original target for ${item.name}`);
    } else if ((!targetedThisCombat && !autoDamageIfCondition) || //if auto damage applied by conditional save
      (targetedThisCombat && ((targetTokenTracker.hasLeft && isLaterTurn) || (applyAutoConditionDamage && isLaterTurn)))
    ) {
      console.debug(`Token ${target.name} is targeted for immediate damage with ${item.name}, using the following factors`, { originalTarget, castTurn, targetedThisCombat, targetTokenTracker, isLaterTurn });
      targetTokenTracker.hasLeft = false;
      await rollItemDamage(target, lastArg.efData.origin, targetItemTracker.spellLevel);
    } else {
      console.debug(`Token ${target.name} has not evaluated for damage application`);
    }
  }

  targetTokenTracker.turn = game.combat.turn;
  targetTokenTracker.round = game.combat.round;
  await DAE.setFlag(target, `${safeName}Tracker`, targetTokenTracker);
  const allowVsRemoveCondition = item.flags.ddbimporter.effect.allowVsRemoveCondition;
  const hasConditionAppliedEnd = game.dfreds.effectInterface.hasEffectApplied(targetTokenTracker.condition, target.document.uuid);
  const currentTokenCombatTurn = game.combat.current.tokenId === lastArg.tokenId;
  if (currentTokenCombatTurn && allowVsRemoveCondition && hasConditionAppliedEnd) {
    console.warn(`Asking ${target.name} wants to remove ${targetTokenTracker.condition}`);
    await attemptRemoval(target, targetTokenTracker.condition, item);
  }
} else if (args[0] == "off") {
  const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
  const targetToken = await fromUuid(lastArg.tokenUuid);
  const targetTokenTracker = await DAE.getFlag(targetToken, `${safeName}Tracker`);
  const removeOnOff = hasProperty(lastArg, "efData.flags.ddbimporter.effect.removeOnOff")
    ? lastArg.efData.flags.ddbimporter.effect.removeOnOff
    : true;

  if (targetTokenTracker?.condition && removeOnOff && game.dfreds.effectInterface.hasEffectApplied(targetTokenTracker.condition, lastArg.tokenUuid)) {
    console.debug(`Removing ${targetTokenTracker.condition} from ${targetToken.name}`);
    game.dfreds.effectInterface.removeEffect({ effectName: targetTokenTracker.condition, uuid: lastArg.tokenUuid });
  }

  if (targetTokenTracker) {
    targetTokenTracker.hasLeft = true;
    await DAE.setFlag(targetToken, `${safeName}Tracker`, targetTokenTracker);
  }
}
