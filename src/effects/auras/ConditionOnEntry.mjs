import { logger } from "../../lib/_module.mjs";
import DDBEffectHelper from "../DDBEffectHelper.mjs";
import {
  applyAuraToTemplate,
  checkAuraAndApplyCondition,
  removeAuraFromToken,
} from "./shared.mjs";


export default async function conditionOnEntry({
  // eslint-disable-next-line no-unused-vars
  speaker, actor, token, character, item, rolledItem, macroItem,
  args, scope, workflow,
} = {}) {

  DDBEffectHelper.requirementsSatisfied(`${item.name} automation`, ["ActiveAuras", "ddb-importer", "midi-qol"]);

  const flags = foundry.utils.getProperty(item, "flags.ddbimporter.effect") ?? {};
  const lastArg = args[args.length - 1];

  logger.debug("conditionOnEntry ARGS", {
    args,
    lastArg,
    scope,
    item,
    flags,
  });

  if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
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
    await checkAuraAndApplyCondition({
      originDocument: item,
      wait: args[0] == "each",
      tokenUuid: lastArg.tokenUuid,
      everyEntry: flags.everyEntry ?? false,
      allowVsRemoveCondition: flags.allowVsRemoveCondition ?? false,
      activityIds: flags.activityIds ?? [],
      condition: flags.condition,
      nameSuffix: flags.nameSuffix,
    });
  } else if (args[0] == "off") {
    await removeAuraFromToken({
      effectOrigin: lastArg.efData.origin,
      tokenUuid: lastArg.tokenUuid,
      removeOnOff: flags.removeOnOff ?? true,
    });
  }

  return args;
}
