
if (actor.flags?.dae?.onUpdateTarget && args[0].hitTargets.length > 0) {
  const isMarked = actor.flags.dae.onUpdateTarget.find(flag =>
    flag.flagName === "Hunter's Mark" && flag.sourceTokenUuid === args[0].hitTargetUuids[0]
  );
  if (isMarked) {
    const damageType = args[0].item.system.damage.parts[0][1];
    const diceMult = args[0].isCritical ? 2: 1;
    return {damageRoll: `${diceMult}d6[${damageType}]`, flavor: "Hunters Mark Damage"};
  }
}

return {};
