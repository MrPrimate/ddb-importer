// based on @ccjmk and @crymic macro for sleep. Gets targets and ignores those who are immune to sleep.
// uses convinient effects
// Midi-qol "On Use"

const sleepHp = await args[0].damageTotal;
const condition = "Unconscious";
console.log(`Sleep Spell => Available HP Pool [${sleepHp}] points`);
const targets = await args[0].targets
  .filter((i) => i.actor.system.attributes.hp.value != 0 && !i.actor.effects.find((x) => (x.name ?? x.label) === condition))
  .sort((a, b) => (canvas.tokens.get(a.id).actor.system.attributes.hp.value < canvas.tokens.get(b.id).actor.system.attributes.hp.value ? -1 : 1));
let remainingSleepHp = sleepHp;
let sleepTarget = [];

for (let target of targets) {
  const findTarget = await canvas.tokens.get(target.id);
  const targetRaceOrType = DDBImporter?.EffectHelper.getRaceOrType(findTarget.actor);
  const immuneType = ["undead", "construct", "elf", "half-elf"].some((race) => targetRaceOrType.includes(race));
  const immuneCI = findTarget.actor.system.traits.ci.custom.includes("Sleep");
  const sleeping = findTarget.actor.effects.find((i) => (i.name ?? i.label) === condition);
  const targetHpValue = findTarget.actor.system.attributes.hp.value;
  const targetImg = target?.texture?.src;
  if ((immuneType) || (immuneCI) || (sleeping)) {
    console.log(`Sleep Results => Target: ${findTarget.name} | HP: ${targetHpValue} | Status: Resists`);
    sleepTarget.push(`<div class="midi-qol-flex-container"><div>Resists</div><div class="midi-qol-target-npc midi-qol-target-name" id="${findTarget.id}"> ${findTarget.name}</div><div><img src="${targetImg}" width="30" height="30" style="border:0px"></div></div>`);
  } else if (remainingSleepHp >= targetHpValue) {
    remainingSleepHp -= targetHpValue;
    console.log(`Sleep Results => Target: ${findTarget.name} |  HP: ${targetHpValue} | HP Pool: ${remainingSleepHp} | Status: Slept`);
    sleepTarget.push(`<div class="midi-qol-flex-container"><div>Slept</div><div class="midi-qol-target-npc midi-qol-target-name" id="${findTarget.id}"> ${findTarget.name}</div><div><img src="${targetImg}" width="30" height="30" style="border:0px"></div></div>`);
    const gameRound = game.combat ? game.combat.round : 0;
    const effectData = {
      label: "Sleep Spell",
      name: "Sleep Spell",
      img: "icons/svg/sleep.svg",
      origin: args[0].uuid,
      disabled: false,
      duration: { rounds: 10, seconds: 60, startRound: gameRound, startTime: game.time.worldTime },
      flags: { dae: { specialDuration: ["isDamaged"] } },
      changes: [
        DDBImporter.EffectHelper.generateStatusEffectChange(game.i18n.localize("Unconscious"), 20),
      ]
    };

    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: findTarget.actor.uuid, effects: [effectData] });
  } else {
    console.log(`Sleep Results => Target: ${target.name} | HP: ${targetHpValue} | HP Pool: ${remainingSleepHp - targetHpValue} | Status: Missed`);
    sleepTarget.push(`<div class="midi-qol-flex-container"><div>misses</div><div class="midi-qol-target-npc midi-qol-target-name" id="${findTarget.id}"> ${findTarget.name}</div><div><img src="${targetImg}" width="30" height="30" style="border:0px"></div></div>`);
  }
}
await DDBImporter?.EffectHelper.wait(500);
const sleptResults = `<div><div class="midi-qol-nobox">${sleepTarget.join('')}</div></div>`;
const chatMessage = game.messages.get(args[0].itemCardId);
let content = foundry.utils.duplicate(chatMessage.content);
const searchString = /<div class="midi-qol-hits-display">[\s\S]*<div class="end-midi-qol-hits-display">/g;
const replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${sleptResults}`;
content = await content.replace(searchString, replaceString);
await chatMessage.update({ content: content });
