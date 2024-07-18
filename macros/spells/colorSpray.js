// based on @ccjmk and @crymic macro for sleep.
// Midi-qol "On Use"

const blindHp = await args[0].damageTotal;
const immuneConditions = [game.i18n.localize("Blinded"), game.i18n.localize("Unconscious")];
console.log(`Color Spray Spell => Available HP Pool [${blindHp}] points`);
const targets = await args[0].targets
  .filter((i) => i.actor.system.attributes.hp.value != 0 && !i.actor.effects.find((x) => immuneConditions.includes((x.name ?? x.label))))
  .sort((a, b) => (canvas.tokens.get(a.id).actor.system.attributes.hp.value < canvas.tokens.get(b.id).actor.system.attributes.hp.value ? -1 : 1));
let remainingBlindHp = blindHp;
let blindTarget = [];

for (let target of targets) {
  const findTarget = await canvas.tokens.get(target.id);
  const targetHpValue = findTarget.actor.system.attributes.hp.value;
  const targetImg = target?.texture?.src;

  if (remainingBlindHp >= targetHpValue) {
    remainingBlindHp -= targetHpValue;
    console.log(`Color Spray Results => Target: ${findTarget.name} |  HP: ${targetHpValue} | HP Pool: ${remainingBlindHp} | Status: Blinded`);
    blindTarget.push(`<div class="midi-qol-flex-container"><div>Blinded</div><div class="midi-qol-target-npc midi-qol-target-name" id="${findTarget.id}"> ${findTarget.name}</div><div><img src="${targetImg}" width="30" height="30" style="border:0px"></div></div>`);
    const gameRound = game.combat ? game.combat.round : 0;
    const effectData = {
      label: "Color Spray: Blinded",
      name: "Color Spray: Blinded",
      img: args[0].itemData.img,
      origin: args[0].uuid,
      disabled: false,
      duration: { startRound: gameRound, startTime: game.time.worldTime },
      flags: { dae: { specialDuration: ["turnEndSource"] } },
      changes: [
        DDBImporter.EffectHelper.generateStatusEffectChange(game.i18n.localize("Blinded"), 20),
      ]
    };

    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: findTarget.actor.uuid, effects: [effectData] });

  } else {
    console.log(`Color Spray Results => Target: ${target.name} | HP: ${targetHpValue} | HP Pool: ${remainingBlindHp - targetHpValue} | Status: Not enough HP remaining`);
    blindTarget.push(`<div class="midi-qol-flex-container"><div>misses</div><div class="midi-qol-target-npc midi-qol-target-name" id="${findTarget.id}"> ${findTarget.name}</div><div><img src="${targetImg}" width="30" height="30" style="border:0px"></div></div>`);
  }
}
await DDBImporter?.EffectHelper.wait(500);
const blindResults = `<div><div class="midi-qol-nobox">${blindTarget.join('')}</div></div>`;
const chatMessage = game.messages.get(args[0].itemCardId);
let content = foundry.utils.duplicate(chatMessage.content);
const searchString = /<div class="midi-qol-hits-display">[\s\S]*<div class="end-midi-qol-hits-display">/g;
const replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${blindResults}`;
content = await content.replace(searchString, replaceString);
await chatMessage.update({ content: content });
