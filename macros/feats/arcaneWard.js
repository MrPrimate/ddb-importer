const arcaneWardDocName = "Arcane Ward";
const arcaneWardAbsorptionEffectLabel = "Arcane Ward: Absorption Effect";
const rollMode = "gmroll";

function getWardValue(item) {
  return {
    wardStrength: item.system?.uses.value,
    wardStrengthMax: item.system?.uses.max,
  };
}

async function updateWardStrength(item, wardStrength) {
  return item.update({ "system.uses.spent": item.system.uses.max - wardStrength });
}

// increase ward if abjuration spell passed
if (
  args[0].macroPass === "postActiveEffects" &&
  args[0].itemData?.system.school === "abj" &&
  args[0].itemData?.system.level > 0
) {
  const wardDocument = args[0].actor.items.find((i) => i.name === arcaneWardDocName);
  if (!wardDocument) {
    ui.notifications.error(`Unable to find ${arcaneWardDocName} on ${args[0].actor.name}`);
    return;
  }
  let { wardStrength, wardStrengthMax } = getWardValue(wardDocument);
  let newWardStrength = Math.min(wardStrength + args[0].spellLevel * 2, wardStrengthMax);

  const speaker = ChatMessage.getSpeaker({ actor });
  const chatData = {
    content: `${wardDocument.name} gains ${args[0].spellLevel * 2} points to ${newWardStrength}/${wardStrengthMax}`,
    speaker
  };

  ChatMessage.applyRollMode(chatData, rollMode);
  ChatMessage.create(chatData);
  if (wardStrength !== newWardStrength) {
    await updateWardStrength(macroItem, newWardStrength);
  }

  // const additionalHP = args[0].castData.castLevel * 2;
  // const newHP = Math.min(wardDocument.system.uses.value + additionalHP, wardDocument.system.uses.max);
  // if (newHP !== wardDocument.system.uses.value) {
  //   const speaker = ChatMessage.getSpeaker({ actor: args[0].actor });
  //   ChatMessage.create({
  //     content: `${arcaneWardDocName} regains ${additionalHP} points, to a total of ${newHP} out of a total of ${wardDocument.system.uses.max}.`,
  //     speaker
  //   });
  //   await args[0].actor.updateEmbeddedDocuments("Item", [{
  //     _id: wardDocument._id,
  //     system: {
  //       uses: {
  //         spent: wardDocument.system.uses.max - newHP,
  //       }
  //     }
  //   }]);
  // }

  // const absorptionEffect = args[0].actor.effects.find((e) => (e.name ?? e.label) === arcaneWardAbsorptionEffectLabel);
  // if (!absorptionEffect) {
  //   // create absorption effect
  //   const effectData = {
  //     changes: [
  //       {
  //         key: "flags.dae.onUpdateTarget",
  //         mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
  //         value: `${args[0].sourceItemUuid}, ${args[0].tokenUuid}, ${args[0].tokenUuid}, ${args[0].actorUuid}, Arcane Ward Absorption, ItemMacro, system.attributes.hp.value`,
  //         priority: 20
  //       }
  //     ],
  //     origin: args[0].sourceItemUuid,
  //     disabled: false,
  //     transfer: true,
  //     img: args[0].item.img,
  //     label: arcaneWardAbsorptionEffectLabel,
  //     name: arcaneWardAbsorptionEffectLabel,
  //   };
  //   foundry.utils.setProperty(effectData, "flags.dae.specialDuration", ["longRest"]);
  //   await args[0].actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  // }

} else if (args[0] === "onUpdateActor") {
  const lastArg = args[args.length - 1];
  let newHP = foundry.utils.getProperty(lastArg.updates, "system.attributes.hp.value");
  const oldHP = lastArg.targetActor.system.attributes.hp.value;
  if (newHP && oldHP && newHP < oldHP) {

    const wardDocument = lastArg.targetActor.items.find((i) => i.name === arcaneWardDocName);
    if (!wardDocument) return;
    let { wardStrengthMax, wardStrength } = getWardValue(wardDocument);
    const damage = oldHP - newHP;
    const absorbed = Math.min(damage, wardStrength ?? 0);

    if (absorbed > 0) {
      newHP = newHP + absorbed;
      const speaker = ChatMessage.getSpeaker({ actor: lastArg.targetActor });
      const chatData = {
        content: `${lastArg.originItem.name} absorbs ${absorbed} of ${damage} points of damage.<br> Hp -> ${newHP}<br>Wardstrength -> ${wardStrength - absorbed}`,
        speaker
      };
      ChatMessage.applyRollMode(chatData, rollMode);
      ChatMessage.create(chatData);
      // lastArg.updates.system.attributes.hp.spent = absorbed;
      lastArg.updates.system.attributes.hp.value = newHP;
      await updateWardStrength(macroItem, wardStrength - absorbed);
      // await lastArg.targetActor.updateEmbeddedDocuments("Item", [{
      //   _id: wardDocument._id,
      //   system: {
      //     uses: {
      //       spent: absorbed,
      //     }
      //   }
      // }]);
    }
  }
  return true;
}
