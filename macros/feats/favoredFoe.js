if (actor.flags?.dae?.onUpdateTarget && args[0].hitTargets.length > 0) {
  const isMarked = actor.flags.dae.onUpdateTarget.find(flag =>
    flag.flagName === "Favored Foe" && flag.sourceTokenUuid === args[0].hitTargetUuids[0]
  );

  if (isMarked) {
    const targetUuid = args[0].hitTargets[0].uuid;
    if (targetUuid == getProperty(actor.flags, "midi-qol.favoredFoeHit")) {
      console.debug("Favored Foe used this turn");
      return {};
    }

    const favoredFoeHitData = {
      changes: [
        {
          key: "flags.midi-qol.favoredFoeHit",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: targetUuid,
          priority: 20
        }
      ],
      origin: args[0].uuid, //flag the effect as associated to the spell being cast
      disabled: false,
      icon: args[0].item.img,
      label: "Favored Foe Hit",
    };
    setProperty(favoredFoeHitData, "flags.dae.specialDuration", ["turnStartSource"]);
    await actor.createEmbeddedDocuments("ActiveEffect", [favoredFoeHitData]);

    const damageType = args[0].item.system.damage.parts[0][1];
    const diceMult = args[0].isCritical ? 2 : 1;
    return { damageRoll: `${diceMult}${args[0].actor._classes.ranger.scaleValues['favored-foe'].substr(1)}[${damageType}]`, flavor: "Favored Foe" };
  }
}

return {};
