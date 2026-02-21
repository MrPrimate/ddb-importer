import { logger } from "../../lib/_module";
import DDBEffectHelper from "../DDBEffectHelper";

export default async function auraOnly({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  speaker, actor, token, character, item, rolledItem, macroItem,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  args, scope, workflow,
} = {}) {

  DDBEffectHelper.requirementsSatisfied(`${item.name} automation`, ["ActiveAuras"]);

  const lastArg = args[args.length - 1];
  const flags = foundry.utils.getProperty(item, "flags.ddbimporter.effect") ?? {};

  logger.debug("AuraOnly ARGS", {
    args,
    lastArg,
    scope,
    item,
    flags,
  });

  if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return game.modules.get("ActiveAuras").api.AAHelpers.applyTemplate(args);

  }

  return args;
}
