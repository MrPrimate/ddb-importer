if (args[0].tag !== "DamageBonus" && args[0].hitTargets.length < 1) return;

if (args[0].isCritical) {
  const crushCriticalFeatName = "Crusher";
  const crusherFeat = args[0].actor.items.find((i) => i.name === crushCriticalFeatName)?.uuid;
  const criticalEffectName = "Crusher: Critical Advantage";
  const crusherIcon = "icons/weapons/hammers/hammer-double-stone.webp";

  for (const hitTarget of args[0].hitTargets) {
    if (!hitTarget.actor._source.effects.some((e) => e.name === criticalEffectName)) {
      const effect = {
        label: criticalEffectName,
        name: criticalEffectName,
        img: crusherIcon,
        origin: crusherFeat?.uuid,
        disabled: false,
        transfer: false,
        duration: {
          rounds: 1,
          startRound: game.combat ? game.combat.round : 0,
          startTime: game.time.worldTime,
        },
        changes: [
          {
            key: "flags.midi-qol.grants.advantage.attack.all",
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: 1,
            priority: 20,
          },
        ],
      };
      foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnStartSource"]);
      await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: hitTarget.actor.uuid, effects: [effect] });
    }
  }
}

const activity = args[0].attackRoll.data.activity;

// console.warn(activity);
if (activity.type !== "attack") return;

const damageType = game.i18n.localize("bludgeoning");
console.warn({args, damageType,


})
if (!args[0].damageDetail.some(i => i.type === damageType)) {
  console.warn({
    damageType,

  })
  return;
}

const sourceActor = (await fromUuid(args[0].tokenUuid)).actor;

const sourceSize = Object.keys(CONFIG.DND5E.actorSizes).indexOf(args[0].actor.system.traits.size);
const targetSizes = args[0].hitTargets.map((target) => {
  return {
    name: target.name,
    size: Object.keys(CONFIG.DND5E.actorSizes).indexOf(target.actor.system.traits.size),
  };
});
const goodTargets = targetSizes.filter((t) => sourceSize >= ((t.size) - 1)).map((t) => t.name);
const badTargets = targetSizes.filter((t) => sourceSize < ((t.size) - 1)).map((t) => t.name);

let content = goodTargets.length > 0
  ? `<i>Once per turn</i> you may move one of the hit targets (${goodTargets.join(", ")}) 5 feet to an unoccupied space.`
  : "";

if (badTargets.length > 0) {
  if (goodTargets.length > 0) {
    content += `<br>You <b>cannot</b> move the following hit targets as they are too large  (${badTargets.join(", ")})`
  } else {
    content = `You can't move the hit targets (${badTargets.join(", ")}) because they are too large.`
  }
}

if (badTargets.length > 0 || goodTargets.length > 0) {
  await ChatMessage.create({
    user: game.user.id,
    content: `<b>Crusher</b><br>${content}`,
    speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
  }, {});
}
