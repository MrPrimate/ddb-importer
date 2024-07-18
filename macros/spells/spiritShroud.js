// an OnUse macro used with Midi provided by @kaelad

function addDamageType(damageType, caster) {
  // find the active effect
  const dice = Math.floor((args[0].spellLevel - 1) / 2);
  DAE.setFlag(caster, "spiritShroud", { dice, type: damageType });
}

function selectDamage(caster) {
  // ask for the damage type
  new Dialog({
    title: "Choose the damage type",
    buttons: {
      cold: {
        icon: `<i class="fas fa-snowflake"></i>`,
        label: "Cold",
        callback: () => addDamageType("cold", caster),
      },
      necrotic: {
        icon: `<i class="fas fa-skull-crossbones"></i>`,
        label: "Necrotic",
        callback: () => addDamageType("necrotic", caster),
      },
      radiant: {
        icon: `<i class="fas fa-star-of-life"></i>`,
        label: "Radiant",
        callback: () => addDamageType("radiant", caster),
      },
    },
  }).render(true);
}

// onUse macro
if (args[0].hitTargets.length === 0) return;



if (args[0].tag === "OnUse") {
  const tokenOrActor = await fromUuid(args[0].actorUuid);
  const caster = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

  const effectData = {
    changes: [
      {
        key: "flags.dnd5e.DamageBonusMacro",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: DDBImporter.lib.DDBMacros.generateItemMacroValue({ macroType: "spell", macroName: "spiritShroud.js", document: { name: "Spirit Shroud" } }),
        priority: 20,
      }, // macro to apply the damage
    ],
    origin: args[0].itemUuid,
    disabled: false,
    duration: args[0].item.effects[0].duration,
    img: args[0].item.img,
    label: args[0].item.name,
    name: args[0].item.name,
  };
  effectData.duration.startTime = game.time.worldTime;
  await caster.createEmbeddedDocuments("ActiveEffect", [effectData]);
  selectDamage(caster);
} else if (args[0].tag === "DamageBonus") {
  // only attacks
  if (!["mwak", "rwak", "rsak", "msak"].includes(args[0].item.system.actionType)) return {};
  const target = args[0].hitTargets[0];
  // only on the marked target
  if (!foundry.utils.hasProperty(target.actor.data, "flags.midi-qol.spiritShroud")) return {};
  const tokenOrActor = await fromUuid(args[0].actorUuid);
  const caster = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  const data = DAE.getFlag(caster, "spiritShroud");
  const damageType = args[0].item.system.damage.parts[0][1];
  const diceNumber = data.dice;
  const diceMult = args[0].isCritical ? 2 * diceNumber : diceNumber;
  const damage = { damageRoll: `${diceMult}d8[${damageType}]`, flavor: "Spirit Shroud Damage" };
  return damage;
}
