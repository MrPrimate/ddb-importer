const lastArg = args[args.length - 1];

// DAE Macro Execute, Effect Value = "Macro Name"
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const activity = await fromUuid(lastArg.activity);

const DAEItem = lastArg.efData.flags.dae.itemData;
const saveData = DAEItem.system.save;
const saveDC = activity.save.dc.value;

if (args[0] === "each") {
  new Dialog({
    title: "Use action to make a wisdom save to end Irresistible Dance?",
    buttons: {
      one: {
        label: "Yes",
        callback: async () => {
          const flavor = `${CONFIG.DND5E.abilities[saveData.ability].label} DC${saveDC} ${DAEItem?.name || ""}`;

          const speaker = ChatMessage.getSpeaker({ targetActor, scene: canvas.scene, token: token.document });
          const saveRoll = (await targetActor.rollSavingThrow({
            ability: activity.save.ability.first(),
            target: activity.save.dc.value,
          }, {}, { data: { speaker, flavor } }))[0];

          if (saveRoll.total >= saveDC) {
            targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
          } else if (saveRoll < saveDC) ChatMessage.create({ content: `${targetActor.name} fails the save` });
        },
      },
      two: {
        label: "No",
      },
    },
  }).render(true);
}
