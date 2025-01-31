import { logger, utils } from "../../lib/_module.mjs";
import DDBEffectHelper from "../DDBEffectHelper.mjs";
import { setBasicCombatFlag } from "./shared.mjs";


// Pack Damage (Aura Automation) from Conjure Animals

export default async function damageOnEntry({
  // eslint-disable-next-line no-unused-vars
  speaker, actor, token, character, item, rolledItem, macroItem,
  // eslint-disable-next-line no-unused-vars
  args, scope, workflow,
} = {}) {

  const lastArg = args[args.length - 1];

  // console.warn({
  //   args,
  //   scope,
  //   item,
  //   lastArg,
  //   token,
  //   actor,
  // });

  const doc = scope.macroActivity?.item ?? scope.macroItem ?? item;
  const itemName = doc.name;
  const baseName = utils.idString(itemName);
  const flagNameTurn = `${baseName}Turn`;
  const flagNameCalled = `${baseName}Called`;

  // console.warn({
  //   args,
  //   scope,
  //   item,
  //   lastArg,
  //   token,
  //   actor,
  //   baseName,
  //   itemName,
  //   flagNameTurn,
  //   flagNameCalled,
  //   doc,
  //   docObj: doc.toObject(),
  // });

  // macro will run on the caster, we want to ignore this
  if (doc.actor.uuid === actor.uuid) {
    logger.debug(`Ignoring ${itemName} macro call for ${actor.name} as they are the caster`);
    return;
  }

  if (args[0] === "on") {
    // console.warn("on", { args, lastArg, scope, item });
    const turnFlag = DDBEffectHelper.getFlag(actor, flagNameTurn) ?? {};

    if (turnFlag
      && turnFlag.id === game.combat?.id
      && turnFlag.turn === game.combat?.current?.turn
      && turnFlag.round === game.combat?.current?.round
    ) {
      logger.log(`${actor.name} has taken the ${itemName} damage already this turn`);
      return;
    }

    // set flag for turn check
    await setBasicCombatFlag(actor, flagNameTurn);
    // set flag to prevent end of turn roll
    await DDBEffectHelper.setFlag(actor, flagNameCalled, true);

    const slotLevel = scope.effect?.flags["midi-qol"].castData?.castLevel ?? undefined;
    const scaling = slotLevel
      ? slotLevel - scope.effect?.flags["midi-qol"].castData?.baseLevel
      : undefined;

    const activityIds = foundry.utils.getProperty(doc, "flags.ddbimporter.effect.activityIds") ?? [];

    for (const activityId of activityIds) {
      const activity = doc.system.activities.get(activityId);
      logger.verbose(`${doc.name} Aura for ${activity.name ?? activity.type}`, activity);
      await DDBEffectHelper.rollMidiActivityUse(activity, {
        targets: [token.document.uuid],
        slotLevel,
        scaling,
      });
    }

  }

  // at start of each turn, reset flags
  if (args[0] === "each" && lastArg.turn === "startTurn") {
    // console.warn("Each startTurn", { args, lastArg, scope, item });
    await DDBEffectHelper.setFlag(actor, flagNameCalled, false);
  }

}
