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
        system: {
          changes: [
            {
              key: "flags.midi-qol.slayersPreyHit",
              type: "override",
              value: targetUuid,
              priority: 20
            }
          ],
        },
        origin: args[0].actorUuid,
        disabled: false,
        img: args[0].item.img,
        name: "Slayer's Prey Hit",
        // "until the start of your next turn" - native sourceStart expiry, DAE flag kept below
        duration: {
          value: null,
          expiry: "sourceStart",
        },
      };
      foundry.utils.setProperty(slayersPreyHitData, "flags.dae.specialDuration", ["turnStartSource"]);
      await args[0].actor.createEmbeddedDocuments("ActiveEffect", [slayersPreyHitData]);

      const damageType = Array.from(args[0].item.system.damage?.base?.types ?? [])[0] ?? "";
      const diceMult = args[0].isCritical ? 2 : 1;
      return { damageRoll: `${diceMult}d6[${damageType}]`, flavor: "Slayer's Prey" };
    }
  }

  return {};
}
