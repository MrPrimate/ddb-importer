const lastArg = args[args.length - 1];

// DAE Macro Execute, Effect Value = "Macro Name"
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const DAEItem = lastArg.efData.flags.dae.itemData;
const saveData = DAEItem.system.save;

if (args[0] === "each") {
  new Dialog({
    title: "Use action to make a wisdom save to end Irresistible Dance?",
    buttons: {
      one: {
        label: "Yes",
        callback: async () => {
          const flavor = `${CONFIG.DND5E.abilities[saveData.ability]} DC${saveData.dc} ${DAEItem?.name || ""}`;
          const saveRoll = (await targetActor.rollAbilitySave(saveData.ability, { flavor })).total;

          if (saveRoll >= saveData.dc) {
            targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
          } else if (saveRoll < saveData.dc) ChatMessage.create({ content: `${targetActor.name} fails the save` });
        },
      },
      two: {
        label: "No",
      },
    },
  }).render(true);
}
