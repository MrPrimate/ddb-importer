if (!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
} else if (!game.modules.get("ddb-importer")?.active) {
  ui.notifications.error("ddb-importer is not enabled");
  return;
}

const lastArg = args[args.length - 1];

async function attemptRemoval(targetToken, condition, item) {
  if (DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(condition, targetToken.actor)) {
    new Dialog({
      title: `Use action to attempt to remove ${condition}?`,
      buttons: {
        one: {
          label: "Yes",
          callback: async () => {
            const caster = item.parent;
            const saveDc = caster.system.attributes.spell.dc;
            const removalCheck = foundry.utils.getProperty(item, "system.flags.ddbimporter.effect.removalCheck");
            const removalSave = foundry.utils.getProperty(item, "system.flags.ddbimporter.effect.removalSave");
            const ability = removalCheck
              ? DDBImporter?.EffectHelper.getHighestAbility(targetToken.actor, removalCheck)
              : DDBImporter?.EffectHelper.getHighestAbility(targetToken.actor, removalSave);
            const type = removalCheck ? "check" : "save";
            const flavor = `${condition} (via ${item.name}) : ${CONFIG.DND5E.abilities[ability].label} ${type} vs DC${saveDc}`;
            const rollResult = removalCheck
              ? (await targetToken.actor.rollAbilityTest(ability, { flavor })).total
              : (await targetToken.actor.rollAbilitySave(ability, { flavor })).total;

            if (rollResult >= saveDc) {
              await DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: targetTokenTracker.condition, actor: targetToken.actor });
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
  if (!DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(condition, targetToken.actor)) {
    const caster = item.parent;
    const workflowItemData = foundry.utils.duplicate(item);
    workflowItemData.system.target = { value: 1, units: "", type: "creature" };
    workflowItemData.system.save.ability = item.flags.ddbimporter.effect.save;
    workflowItemData.system.properties = DDBImporter?.EffectHelper.removeFromProperties(workflowItemData.system.properties, "concentration") ?? [];
    workflowItemData.system.level = itemLevel;
    workflowItemData.system.duration = { value: null, units: "inst" };
    workflowItemData.system.target = { value: null, width: null, units: "", type: "creature" };
    workflowItemData.system.uses = { value: null, max: "", per: null, recovery: "", autoDestroy: false };
    workflowItemData.system.consume = { "type": "", "target": null, "amount": null };
    workflowItemData.system.method = "atwill";
    foundry.utils.setProperty(workflowItemData, "flags.itemacro", {});
    foundry.utils.setProperty(workflowItemData, "flags.midi-qol", {});
    foundry.utils.setProperty(workflowItemData, "flags.dae", {});
    foundry.utils.setProperty(workflowItemData, "effects", []);
    delete workflowItemData._id;
    workflowItemData.name = `${workflowItemData.name}: ${item.name} Condition save`;

    const saveTargets = [...game.user?.targets].map((t )=> t.id);
    game.user.updateTokenTargets([targetToken.id]);
    const saveItem = new CONFIG.Item.documentClass(workflowItemData, { parent: caster });
    const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions();
    const result = await MidiQOL.completeItemUse(saveItem, config, options);

    game.user.updateTokenTargets(saveTargets);
    const failedSaves = [...result.failedSaves];
    if (failedSaves.length > 0) {
      await DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: condition, actor: failedSaves[0].actor });
    }

    return result;
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
  const scalingDiceNumber = item.system.scaling.mode === "none"
    ? 0
    : itemLevel - item.system.level;
  const upscaledDamage =  isCantrip
    ? `${DDBImporter?.EffectHelper.getCantripDice(caster)}d${scalingDiceArray[1]}[${damageType}]`
    : scalingDiceNumber > 0 ? `${scalingDiceNumber}d${scalingDiceArray[1]}[${damageType}] + ${damageDice}` : damageDice;

  console.warn("rollItemDamagae", {
    item,
    caster,
    isCantrip,
    damageDice,
    damageType,
    saveAbility,
    casterToken,
    scalingDiceArray,
    scalingDiceNumber,
  })
  const damageRoll = await new CONFIG.Dice.DamageRoll(upscaledDamage).evaluate();
  await MidiQOL.displayDSNForRoll(damageRoll, "damageRoll");
  const workflowItemData = foundry.utils.duplicate(item);
  workflowItemData.system.target = { value: 1, units: "", type: "creature" };
  workflowItemData.system.save.ability = saveAbility;
  workflowItemData.system.properties = DDBImporter?.EffectHelper.removeFromProperties(workflowItemData.system.properties, "concentration") ?? [];
  workflowItemData.system.level = itemLevel;
  workflowItemData.system.duration = { value: null, units: "inst" };
  workflowItemData.system.uses = { value: null, max: "", per: null, recovery: "", autoDestroy: false };
  workflowItemData.system.consume = { "type": "", "target": null, "amount": null };
  workflowItemData.system.target = { value: null, width: null, units: "", type: "creature" };

  foundry.utils.setProperty(workflowItemData, "flags.itemacro", {});
  foundry.utils.setProperty(workflowItemData, "flags.midi-qol", {});
  foundry.utils.setProperty(workflowItemData, "flags.dae", {});
  foundry.utils.setProperty(workflowItemData, "effects", []);
  delete workflowItemData._id;
  workflowItemData.name = `${workflowItemData.name}: Turn Entry Damage`;

  await new MidiQOL.DamageOnlyWorkflow(
    caster,
    casterToken,
    damageRoll.total,
    damageType,
    [targetToken],
    damageRoll,
    {
      flavor: `(${CONFIG.DND5E.damageTypes[damageType].label})`,
      itemCardId: "new",
      itemData: workflowItemData,
      isCritical: false,
    }
  );
}

if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  const safeName = lastArg.itemData.name.replace(/\s|'|\.|’/g, "_");
  const dataTracker = {
    randomId: foundry.utils.randomID(),
    targetUuids: lastArg.targetUuids,
    startRound: game.combat.round,
    startTurn: game.combat.turn,
    spellLevel: lastArg.spellLevel,
  };

  const item = await fromUuid(lastArg.itemUuid);
  // await item.update(dataTracker);
  await DAE.unsetFlag(item.actor, `${safeName}Tracker`);
  await DAE.setFlag(item.actor, `${safeName}Tracker`, dataTracker);

  const ddbEffectFlags = lastArg.item.flags.ddbimporter?.effect;
  if (ddbEffectFlags) {
    const sequencerFile = ddbEffectFlags.sequencerFile;
    if (sequencerFile) {
      const scale = ddbEffectFlags.sequencerScale ?? 1;
      await DDBImporter?.EffectHelper.attachSequencerFileToTemplate(lastArg.templateUuid, sequencerFile, lastArg.itemUuid, scale);
    }
    if (ddbEffectFlags.isCantrip) {
      const cantripDice = DDBImporter?.EffectHelper.getCantripDice(lastArg.actor);
      args[0].spellLevel = cantripDice;
      ddbEffectFlags.cantripDice = cantripDice;
      let newEffects = args[0].item.effects.map((effect) => {
        effect.changes = effect.changes.map((change) => {
          change.value = change.value.replace("@cantripDice", cantripDice)
          return change;
        });
        return effect;
      });
      args[0].item.effects = foundry.utils.duplicate(newEffects);
      args[0].itemData.effects = foundry.utils.duplicate(newEffects);
    }
    const template = await fromUuid(lastArg.templateUuid);
    await template.update({"flags.effect": ddbEffectFlags});

    if (ddbEffectFlags.applyImmediate) {
      console.debug("Applying immediate effect");
      await DDBImporter?.EffectHelper.wait(500);
      const condition = ddbEffectFlags.condition;
      for (const token of lastArg.failedSaves) {
        if (!DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(condition, token.actor)) {
          console.debug(`Applying ${condition} to ${token.name}`);
          await DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: condition, actor: token.actor });
        }
      };
    }
  }

  console.debug("ItemMacro: Pre-apply finised, applying effect to template")

  return await game.modules.get("ActiveAuras").api.AAHelpers.applyTemplate(args);

} else if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
  if (lastArg.item.flags.ddbimporter?.effect?.applyImmediate) {
    const condition = lastArg.item.flags.ddbimporter.effect.condition;
    for (const token of lastArg.failedSaves) {
      if (!DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(condition, token.actor)) {
        console.debug(`Applying ${condition} to ${token.name}`);
        await DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: condition, actor: token.actor });
      }
    };
  }
} else if (args[0] == "on" || args[0] == "each") {
  const safeName = (lastArg.efData.name ?? lastArg.efData.label).replace(/\s|'|\.|’/g, "_");
  const item = await fromUuid(lastArg.efData.origin);
  const ddbEffectFlags = item.flags.ddbimporter.effect;
  // sometimes the round info has not updated, so we pause a bit
  if (args[0] == "each") await DDBImporter?.EffectHelper.wait(500);
  const targetItemTracker = DAE.getFlag(item.parent, `${safeName}Tracker`);
  const originalTarget = targetItemTracker.targetUuids.includes(lastArg.tokenUuid);
  const target = canvas.tokens.get(lastArg.tokenId);
  const targetTokenTrackerFlag = DAE.getFlag(target.actor, `${safeName}Tracker`);
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
  const everyEntry = foundry.utils.hasProperty(item, "flags.ddbimporter.effect.everyEntry")
    ? item.flags.ddbimporter.effect.everyEntry
    : false;

  // if:
  // not cast turn, and not part of the original target
  // AND one of the following
  // not original template and have not yet had this effect applied this combat OR
  // has been targeted this combat, left and re-entered effect, and is a later turn

  const autoDamageIfCondition = foundry.utils.hasProperty(ddbEffectFlags, "autoDamageIfCondition") ? ddbEffectFlags.autoDamageIfCondition : false;
  const hasConditionStart = DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(targetTokenTracker.condition, target.actor);
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
  await DAE.setFlag(target.actor, `${safeName}Tracker`, targetTokenTracker);
  const allowVsRemoveCondition = item.flags.ddbimporter.effect.allowVsRemoveCondition;
  const hasConditionAppliedEnd = DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(targetTokenTracker.condition, target.actor);
  const currentTokenCombatTurn = game.combat.current.tokenId === lastArg.tokenId;
  if (currentTokenCombatTurn && allowVsRemoveCondition && hasConditionAppliedEnd) {
    console.log(`Asking ${target.name} wants to remove ${targetTokenTracker.condition}`);
    await attemptRemoval(target, targetTokenTracker.condition, item);
  }
} else if (args[0] == "off") {
  const safeName = (lastArg.efData.name ?? lastArg.efData.label).replace(/\s|'|\.|’/g, "_");
  const targetToken = await fromUuid(lastArg.tokenUuid);
  const targetTokenTracker = await DAE.getFlag(targetToken.actor, `${safeName}Tracker`);
  const removeOnOff = foundry.utils.hasProperty(lastArg, "efData.flags.ddbimporter.effect.removeOnOff")
    ? lastArg.efData.flags.ddbimporter.effect.removeOnOff
    : true;

  if (targetTokenTracker?.condition && removeOnOff
    && DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(targetTokenTracker.condition, targetToken.actor)
  ) {
    console.debug(`Removing ${targetTokenTracker.condition} from ${targetToken.name}`);
    await DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: targetTokenTracker.condition, actor: targetToken.actor });
  }

  if (targetTokenTracker) {
    targetTokenTracker.hasLeft = true;
    await DAE.setFlag(targetToken.actor, `${safeName}Tracker`, targetTokenTracker);
  }
}
