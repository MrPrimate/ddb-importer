import { logger } from "../../lib/_module.mjs";
import DDBEffectHelper from "../DDBEffectHelper.mjs";
import {
  applyAuraToTemplate,
  checkAuraAndUseActivity,
  removeAuraFromToken,
} from "./shared.mjs";


export default async function damageOnEntry({
  // eslint-disable-next-line no-unused-vars
  speaker, actor, token, character, item, rolledItem, macroItem,
  // eslint-disable-next-line no-unused-vars
  args, scope, workflow,
} = {}) {

  DDBEffectHelper.requirementsSatisfied(`${item.name} automation`, ["ActiveAuras", "ddb-importer", "midi-qol"]);

  const lastArg = args[args.length - 1];
  const flags = foundry.utils.getProperty(item, "flags.ddbimporter.effect") ?? {};

  logger.debug("damageOnEntry ARGS", {
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
      isCantrip: flags.isCantrip,
    });
    return templateApplication;

  } else if (args[0] == "on") {
    await checkAuraAndUseActivity({
      originDocument: item,
      tokenUuid: lastArg.tokenUuid,
      activityIds: flags.activityIds ?? [],
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
