const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const weapons = targetActor.items.filter((i) => i.type === "weapon");

/**
 * For every str weapon, halve the base damage via a custom formula, keeping the original in a flag.
 */
if (args[0] === "on") {
  for (const weapon of weapons) {
    const attackActivity = weapon.system.activities?.find((a) => a.type === "attack");
    if (attackActivity?.ability !== "str") continue;
    const base = weapon.system.damage.base;
    const original = base.formula;
    if (!original) continue;
    await weapon.setFlag("world", "RayOfEnfeeblementSpell", {
      enabled: base.custom.enabled,
      formula: base.custom.formula,
    });
    await weapon.update({ "system.damage.base.custom": { enabled: true, formula: `floor((${original})/2)` } });
  }
}

// Update weapons to old value
if (args[0] === "off") {
  for (const weapon of weapons) {
    const original = weapon.getFlag("world", "RayOfEnfeeblementSpell");
    if (!original) continue;
    await weapon.update({ "system.damage.base.custom": { enabled: original.enabled, formula: original.formula } });
    await weapon.unsetFlag("world", "RayOfEnfeeblementSpell");
  }
}
