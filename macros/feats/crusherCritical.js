// critical effect
if (args[0].tag === "DamageBonus" && args[0].isCritical) {
  const crushCriticalFeatName = "Crusher: Critical";
  const crusherFeat = args[0].actor.items.find((i) => i.name === crushCriticalFeatName)?.uuid;
  const criticalEffectName = "Crusher: Critical Advantage";
  const crusherIcon = "icons/weapons/hammers/hammer-double-stone.webp";

  for (const hitTarget of args[0].hitTargets) {
    if (!hitTarget.actor._source.effects.some((e) => (e.name ?? e.label) === criticalEffectName)) {
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
