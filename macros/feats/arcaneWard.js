const arcaneWardItemName = "Arcane Ward - Hit Points";
const arcaneWardAbsorptionEffectLabel = "Arcane Ward: Absorption Effect";

// increase ward if abjuration spell passed
if (args[0].macroPass === "preActiveEffects" && args[0].item?.system.school === "abj") {
  const hpItem = args[0].actor.items.find((i) => i.name === arcaneWardItemName);
  if (!hpItem) {
    ui.notifications.error(`Unable to find ${arcaneWardItemName} on ${args[0].actor.name}`);
    return;
  }
  const additionalHP = args[0].castData.castLevel * 2;
  const newHP = Math.min(hpItem.system.uses.value + additionalHP, hpItem.system.uses.max);
  if (newHP !== hpItem.system.uses.value) {
    const speaker = ChatMessage.getSpeaker({ actor: args[0].actor });
    ChatMessage.create({
      content: `Arcane Ward regains ${additionalHP} points, to a total of ${newHP} out of a total of ${hpItem.system.uses.max}.`,
      speaker
    });
    await args[0].actor.updateEmbeddedDocuments("Item", [{
      _id: hpItem._id,
      system: {
        uses: {
          value: newHP,
        }
      }
    }]);
  }

  const arcaneWardAbsorptionEffectLabel = "Arcane Ward: Absorption Effect";
  const absorptionEffect = args[0].actor.effects.find((e) => (e.name ?? e.label) === arcaneWardAbsorptionEffectLabel);
  if (!absorptionEffect) {
    // create absorption effect
    const effectData = {
      changes: [
        {
          key: "flags.dae.onUpdateTarget",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: `${args[0].sourceItemUuid}, ${args[0].tokenUuid}, ${args[0].tokenUuid}, ${args[0].actorUuid}, Arcane Ward Absorption, ItemMacro, system.attributes.hp.value`,
          priority: 20
        }
      ],
      origin: args[0].sourceItemUuid,
      disabled: false,
      transfer: true,
      img: args[0].item.img,
      label: arcaneWardAbsorptionEffectLabel,
      name: arcaneWardAbsorptionEffectLabel,
    };
    foundry.utils.setProperty(effectData, "flags.dae.specialDuration", ["longRest"]);
    await args[0].actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

} else if (args[0] === "onUpdateActor") {
  const lastArg = args[args.length - 1];
  let newHP = foundry.utils.getProperty(lastArg.updates, "system.attributes.hp.value");
  const oldHP = lastArg.targetActor.system.attributes.hp.value;
  if (newHP && oldHP && newHP < oldHP) {
    const damage = oldHP - newHP;
    const hpItem = lastArg.targetActor.items.find((i) => i.name === arcaneWardItemName);
    if (!hpItem) return;
    const wardStrength = hpItem.system.uses.value;
    const absorbed = Math.min(damage, wardStrength ?? 0);
    if (absorbed > 0) {
      newHP = newHP + absorbed;
      const speaker = ChatMessage.getSpeaker({ actor: lastArg.targetActor });
      ChatMessage.create({
        content: `${lastArg.originItem.name} absorbs ${absorbed} of ${damage} points of damage.<br> Hp -> ${newHP}<br>Wardstength -> ${wardStrength - absorbed}`,
        speaker
      });
      lastArg.updates.system.attributes.hp.value = newHP;
      await lastArg.targetActor.updateEmbeddedDocuments("Item", [{
        _id: hpItem._id,
        system: {
          uses: {
            value: wardStrength - absorbed,
          }
        }
      }]);
    }
  }
  return true;
}
