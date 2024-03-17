if (!["spell"].some((value) => args[0].item.type.includes(value))) return; // if there is anything else that should trigger it, add it here like ["spell","bananas"]
if (!["fire", "radiant"].some((value) => args[0].damageDetail.find((i) => i.type.includes(value)))) return; // if not fire or radiant stop

const damageType = args[0].damageDetail.find((i) =>
  ["fire", "radiant"].some((value) => args[0].damageDetail.find((i) => i.type.includes(value)))
).type; // ugly but works

const extraDamage = args[0].actorData.system.abilities.cha.mod;
const dialog = new Promise((resolve, reject) => {
  new Dialog({
    title: `Radiant Soul: You used a ${damageType} damage dealing spell`,
    content: `<p>Choose on of the targeted tokens to deal extra damage</p>`,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: "Confirm",
        callback: async () => {
          const target = game.user.targets;
          let target2 = await fromUuid(args[0].hitTargetUuids[0] ?? "");
          console.log(target2);
          if (!game.user.targets.first().document.name) {
            ui.notifications.error(`You did not target anything for Radiant Soul Extra Damage!`);
          } else {
            const chatMessage = game.messages.get(args[0].itemCardId);
            var content = foundry.utils.duplicate(chatMessage.content);
            const searchString = '<div class="midi-qol-hits-display">';
            const replaceString = `<div class="midi-qol-hits-display">${extraDamage} [${damageType}] from Radiant Soul to<div class="midi-qol-target-npc-player midi-qol-target-name" id="${
              game.user.targets.first().document.id
            }"> ${game.user.targets.first().document.name}</div>`;
            content = content.replace(searchString, replaceString);
            chatMessage.update({ content: content });
            await MidiQOL.applyTokenDamage(
              [{ type: `${damageType}`, damage: extraDamage }],
              extraDamage,
              new Set([target.first()]),
              item,
              new Set()
            );
          }
        },
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => {
          resolve(false);
        },
      },
    },
    default: "two",
    close: () => {
      resolve(false);
    },
  }).render(true);
});
