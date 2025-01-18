import { logger } from "../../lib/_module.mjs";
import DDBEffectHelper from "../DDBEffectHelper.mjs";
import {
  applyAuraToTemplate,
  checkAuraAndApplyCondition,
  getSafeName,
  removeAuraFromToken,
} from "./shared.mjs";



async function rollItemDamage(targetToken, itemUuid, itemLevel) {
  const item = await fromUuid(itemUuid);
  const caster = item.parent;
  const ddbEffectFlags = item.flags.ddbimporter.effect;
  const isCantrip = ddbEffectFlags.isCantrip;
  const damageDice = ddbEffectFlags.dice;
  const damageType = ddbEffectFlags.damageType;
  const saveAbility = ddbEffectFlags.save;
  const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);
  const scalingDiceArray = item.system.scaling.formula.split("d");
  const scalingDiceNumber = item.system.scaling.mode === "none"
    ? 0
    : itemLevel - item.system.level;
  const upscaledDamage = isCantrip
    ? `${DDBEffectHelper.getCantripDice(caster)}d${scalingDiceArray[1]}[${damageType}]`
    : scalingDiceNumber > 0 ? `${scalingDiceNumber}d${scalingDiceArray[1]}[${damageType}] + ${damageDice}` : damageDice;

  const workflowItemData = foundry.utils.duplicate(item);
  workflowItemData.system.target = { value: 1, units: "", type: "creature" };
  workflowItemData.system.save.ability = saveAbility;
  workflowItemData.system.properties = DDBEffectHelper.removeFromProperties(workflowItemData.system.properties, "concentration") ?? [];
  workflowItemData.system.level = itemLevel;
  workflowItemData.system.duration = { value: null, units: "inst" };
  workflowItemData.system.target = { value: null, width: null, units: "", type: "creature" };
  workflowItemData.system.uses = { value: null, max: "", per: null, recovery: "", autoDestroy: false };
  workflowItemData.system.consume = { "type": "", "target": null, "amount": null };

  foundry.utils.setProperty(workflowItemData, "flags.itemacro", {});
  foundry.utils.setProperty(workflowItemData, "flags.midi-qol", {});
  foundry.utils.setProperty(workflowItemData, "flags.dae", {});
  foundry.utils.setProperty(workflowItemData, "effects", []);
  delete workflowItemData._id;

  const saveOnEntry = ddbEffectFlags.saveOnEntry;
  // console.warn("saveOnEntry", {ddbEffectFlags, saveOnEntry});
  if (saveOnEntry) {
    const entryItem = new CONFIG.Item.documentClass(workflowItemData, { parent: caster });
    // console.warn("Saving item on entry", {entryItem, targetToken});
    const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions({ targets: [targetToken.document.uuid] });
    await MidiQOL.completeItemUse(entryItem, config, options);
  } else {
    const damageRoll = await new CONFIG.Dice.DamageRoll(upscaledDamage).evaluate();
    await MidiQOL.displayDSNForRoll(damageRoll, "damageRoll");

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

}

export default async function damageOnEntry({
  // eslint-disable-next-line no-unused-vars
  speaker, actor, token, character, item, rolledItem, macroItem,
  // eslint-disable-next-line no-unused-vars
  args, scope, workflow,
} = {}) {

  DDBEffectHelper.requirementsSatisfied(`${item.name} automation`, ["ActiveAuras", "ddb-importer", "midi-qol"]);

  const lastArg = args[args.length - 1];


  if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    const flags = foundry.utils.getProperty(item, "flags.ddbimporter.effect") ?? {};
    const templateApplication = await applyAuraToTemplate(args, {
      originDocument: item,
      condition: flags.condition,
      targetUuids: Array.from(workflow.targets.map((t) => t.document.uuid)),
      sequencerFile: flags.sequencerFile,
      sequencerScale: flags.sequencerScale,
      applyImmediate: flags.applyImmediate,
      templateUuid: workflow.templateUuid,
      spellLevel: workflow.spellLevel,
      failedSaveTokens: workflow.failedSaves,
      isCantrip: flags.isCantrip,
    });
    return templateApplication;

  } else if (args[0] == "on") {
    const safeName = (lastArg.efData.name ?? lastArg.efData.label).replace(/\s|'|\.|’/g, "_");
    const item = await fromUuid(lastArg.efData.origin);
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
      };

    const castTurn = targetItemTracker.startRound === game.combat.round && targetItemTracker.startTurn === game.combat.turn;
    const isLaterTurn = game.combat.round > targetTokenTracker.round || game.combat.turn > targetTokenTracker.turn;

    // if:
    // not cast turn, and not part of the original target
    // AND one of the following
    // not original template and have not yet had this effect applied this combat OR
    // has been targeted this combat, left and re-entered effect, and is a later turn
    if (castTurn && originalTarget) {
      console.debug(`Token ${target.name} is part of the original target for ${item.name}`);
    } else if (!targetedThisCombat || (targetedThisCombat && targetTokenTracker.hasLeft && isLaterTurn)){
      console.debug(`Token ${target.name} is targeted for immediate damage with ${item.name}, using the following factors`, { originalTarget, castTurn, targetedThisCombat, targetTokenTracker, isLaterTurn });
      targetTokenTracker.hasLeft = false;
      await rollItemDamage(target, lastArg.efData.origin, targetItemTracker.spellLevel);
    }
    await DAE.setFlag(target.actor, `${safeName}Tracker`, targetTokenTracker);
  } else if (args[0] == "off") {
    const safeName = (lastArg.efData.name ?? lastArg.efData.label).replace(/\s|'|\.|’/g, "_");
    const target = canvas.tokens.get(lastArg.tokenId);
    const targetTokenTracker = DAE.getFlag(target.actor, `${safeName}Tracker`);

    if (targetTokenTracker) {
      targetTokenTracker.hasLeft = true;
      targetTokenTracker.turn = game.combat.turn;
      targetTokenTracker.round = game.combat.round;
      await DAE.setFlag(target.actor, `${safeName}Tracker`, targetTokenTracker);
    }
  }

  return args;
}
