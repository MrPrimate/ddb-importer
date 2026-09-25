if (args[0].tag === "OnUse") {
  const lastArg = args[args.length - 1];
  const item = await fromUuid(lastArg.itemUuid);
  MidiQOL.addConcentration(lastArg.actor, {item: item, targets: lastArg.targets});

} else {
  if (args[0].actor.flags?.dae?.onUpdateTarget && args[0].hitTargets.length > 0) {
    const isMarked = args[0].actor.flags.dae.onUpdateTarget.find(flag =>
      flag.flagName === "Favored Foe" && flag.sourceTokenUuid === args[0].hitTargetUuids[0]
    );

    if (isMarked) {
      const targetUuid = args[0].hitTargets[0].uuid;
      if (targetUuid == foundry.utils.getProperty(args[0].actor.flags, "midi-qol.favoredFoeHit")) {
        console.debug("Favored Foe used this turn");
        return {};
      }

      const favoredFoeHitData = {
        system: {
          changes: [
            {
              key: "flags.midi-qol.favoredFoeHit",
              type: "override",
              value: targetUuid,
              priority: 20
            }
          ],
        },
        origin: args[0].actorUuid,
        disabled: false,
        img: args[0].item.img,
        name: "Favored Foe Hit",
        // "until the start of your next turn" - native sourceStart expiry, DAE flag kept below
        duration: {
          value: null,
          expiry: "sourceStart",
        },
      };
      foundry.utils.setProperty(favoredFoeHitData, "flags.dae.specialDuration", ["turnStartSource"]);
      await args[0].actor.createEmbeddedDocuments("ActiveEffect", [favoredFoeHitData]);

      const damageType = Array.from(args[0].item.system.damage?.base?.types ?? [])[0] ?? "";
      const diceMult = args[0].isCritical ? 2 : 1;
      return { damageRoll: `${diceMult}d${args[0].actor.classes.ranger.scaleValues["favored-foe"].faces }[${damageType}]`, flavor: "Favored Foe" };
    }
  }

  return {};
}
