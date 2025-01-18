import { logger } from "../../lib/_module.mjs";
import DDBEffectHelper from "../DDBEffectHelper.mjs";
import {
  applyAuraToTemplate,
  checkAuraAndApplyCondition,
  removeAuraFromToken,
} from "./shared.mjs";

// flags.ddbimporter.effect used
// const effectData = {
//   activityIds: [], // activity ids to retain on duplicated item
//   sequencerFile: "fun.webp", // sequencer file to apply for animation
//   sequencerScale: 1, // sequencer scale for animations
//   condition: "prone", // condition to apply
//   everyEntry: false, // apply the save/condition on every entry
//   allowVsRemoveCondition: false, // allow a save vs remove condiiton
//   removeOnOff: true, // remove condition when effect ends
//   applyImmediate: false, // apply effect immediately based on failed saves of rolled item
//   removalCheck: false, // an ability check is used for removal
//   removalSave: false, // an ability save is used for removal
//   isCantrip: false, // will attempt to replace @cantripDice used in any effect change with actors cantrip dice number
// };

// const targetTokenTracker = {
//   targetUuids: [],
//   randomId: "16digits",
//   startRound: 0,
//   startTurn: 0,
//   hasLeft: false,
//   condition: "prone",
//   spellLevel: 1,
// };

export default async function conditionOnEntry({
  // eslint-disable-next-line no-unused-vars
  speaker, actor, token, character, item, rolledItem, macroItem,
  args, scope, workflow,
} = {}) {

  DDBEffectHelper.requirementsSatisfied(`${item.name} automation`, ["ActiveAuras", "ddb-importer", "midi-qol"]);

  const lastArg = args[args.length - 1];

  logger.debug("conditionOnEntry ARGS", {
    args,
    lastArg,
    scope,
    item,
  });

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
    });
    return templateApplication;
  } else if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
    // if using postActiveEffects midi call check saves and apply
    const flags = foundry.utils.getProperty(item, "flags.ddbimporter.effect") ?? {};
    if (flags.applyImmediate && flags.condition) {
      for (const token of lastArg.failedSaves) {
        if (!DDBEffectHelper.isConditionEffectAppliedAndActive(flags.condition, token.actor)) {
          logger.debug(`Applying ${flags.condition} to ${token.name}`);
          await DDBEffectHelper.adjustCondition({
            add: true,
            conditionName: flags.condition,
            actor: token.actor,
          });
        }
      };
    }
  } else if (args[0] == "on" || args[0] == "each") {
    const flags = foundry.utils.getProperty(item, "flags.ddbimporter.effect") ?? {};
    await checkAuraAndApplyCondition({
      originDocument: item,
      wait: args[0] == "each",
      tokenUuid: lastArg.tokenUuid,
      everyEntry: flags.everyEntry ?? false,
      allowVsRemoveCondition: flags.allowVsRemoveCondition ?? false,
      spellLevel: args[1],
      activityIds: flags.activityIds ?? [],
      condition: flags.condition,
    });
  } else if (args[0] == "off") {
    await removeAuraFromToken({
      effectOrigin: lastArg.efData.origin,
      tokenUuid: lastArg.tokenUuid,
      removeOnOff: foundry.utils.getProperty(item, "flags.ddbimporter.effect.removeOnOff") ?? true,
    });
  }

  return args;
}
