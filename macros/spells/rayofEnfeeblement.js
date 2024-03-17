const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const weapons = targetActor.items.filter((i) => i.type === "weapon");

/**
 * For every str weapon, update the damage formulas to half the damage, set flag of original
 */
if (args[0] === "on") {
  weapons.forEach((weapon) => {
    if (weapon.abilityMod === "str") {
      const originalParts = foundry.utils.duplicate(weapon.system.damage.parts);
      weapon.setFlag("world", "RayOfEnfeeblementSpell", originalParts);
      weapon.system.damage.parts.forEach((part) => {
        part[0] = `floor((${part[0]})/2)`;
      });
      weapon.update({ "system.damage.parts": weapon.system.damage.parts });
    }
  });
}

// Update weapons to old value
if (args[0] === "off") {
  weapons.forEach((weapon) => {
    const parts = weapon.getFlag("world", "RayOfEnfeeblementSpell");
    weapon.update({ "system.damage.parts": parts });
  });
}
