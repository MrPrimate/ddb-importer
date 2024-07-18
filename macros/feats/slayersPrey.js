if (args[0].tag === "OnUse") {
  return;
} else {
  if (args[0].actor.flags?.dae?.onUpdateTarget && args[0].hitTargets.length > 0) {
    const isMarked = args[0].actor.flags.dae.onUpdateTarget.find((flag) =>
      flag.flagName === "Slayer's Prey" && flag.sourceTokenUuid === args[0].hitTargetUuids[0]
    );

    if (isMarked) {
      const targetUuid = args[0].hitTargets[0].uuid;
      if (targetUuid == foundry.utils.getProperty(args[0].actor.flags, "midi-qol.slayersPreyHit")) {
        console.debug("Slayer's Prey used this turn");
        return {};
      }

      const slayersPreyHitData = {
        changes: [
          {
            key: "flags.midi-qol.slayersPreyHit",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: targetUuid,
            priority: 20
          }
        ],
        origin: args[0].actorUuid,
        disabled: false,
        img: args[0].item.img,
        label: "Slayer's Prey Hit",
        name: "Slayer's Prey Hit",
      };
      foundry.utils.setProperty(slayersPreyHitData, "flags.dae.specialDuration", ["turnStartSource"]);
      await args[0].actor.createEmbeddedDocuments("ActiveEffect", [slayersPreyHitData]);

      const damageType = args[0].item.system.damage.parts[0][1];
      const diceMult = args[0].isCritical ? 2 : 1;
      return { damageRoll: `${diceMult}d6[${damageType}]`, flavor: "Slayer's Prey" };
    }
  }

  return {};
}
