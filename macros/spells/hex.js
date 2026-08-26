// onUse macro
if (args[0].hitTargets.length === 0) return;
if (args[0].tag === "OnUse") {
  const targetUuid = args[0].hitTargets[0].uuid;
  const tokenOrActor = await fromUuid(args[0].actorUuid);
  const caster = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

  if (!caster || !targetUuid) {
    ui.notifications.warn("Hex: no token/target selected");
    console.error("Hex: no token/target selected");
    return;
  }

  const effectData = {
    system: {
      changes: [
        {
          key: "flags.midi-qol.hex",
          type: "override",
          value: targetUuid,
          priority: 20
        }, // who is marked
        {
          key: "flags.dnd5e.DamageBonusMacro",
          type: "custom",
          value: DDBImporter.lib.DDBMacros.generateItemMacroValue({ macroType: "spell", macroName: "hex.js", document: { name: "Hex" } }),
          priority: 20,
        }, // macro to apply the damage
      ],
    },
    origin: args[0].uuid, //flag the effect as associated to the spell being cast
    disabled: false,
    duration: foundry.utils.duplicate(args[0].item.effects[0].duration),
    img: args[0].item.img,
    name: args[0].item.name,
  };
  await caster.createEmbeddedDocuments("ActiveEffect", [effectData]);
} else if (args[0].tag === "DamageBonus") {
  const targetUuid = args[0].hitTargets[0].uuid;
  if (targetUuid !== foundry.utils.getProperty(args[0].actor.flags, "midi-qol.hex")) return {};
  const diceMult = args[0].isCritical ? 2 : 1;
  return { damageRoll: `${diceMult}d6[necrotic]`, flavor: "Hex Damage" };
}
