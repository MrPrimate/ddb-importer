// based on @ccjmk and @crymic macro for sleep. Gets targets and ignores those who are immune to sleep.
// Midi-qol "On Use"

const isVersion12 = game.version > 12;
const getEffects = isVersion12 ? "appliedEffects" : "effects";
const labelName = isVersion12 ? "name" : "label";
const localizedEffectName = game.i18n.translations["ddb-importer"]["item-type"].specificSpells.sleep;
const sleepHp = workflow.damageTotal;
const condition = "Unconscious";
console.log(`Sleep Spell => Available HP Pool [${sleepHp}] points`);
const targets = workflow.targets
  .filter((i) => i.actor.system.attributes.hp.value != 0 && !i.actor[getEffects].find((x) => x[labelName] === condition))
  .sort((a, b) => (canvas.tokens.get(a.id).actor.system.attributes.hp.value < canvas.tokens.get(b.id).actor.system.attributes.hp.value ? -1 : 1));
let remainingSleepHp = sleepHp;
let sleepTarget = [];

for (let target of targets) {
  const findTarget = await canvas.tokens.get(target.id);
  const targetRaceOrType = DDBImporter?.EffectHelper.getRaceOrType(findTarget.actor);
  const immuneType = ["undead", "construct", "elf", "half-elf"].some((race) => targetRaceOrType.includes(race));
  const immuneCI = findTarget.actor.system.traits.ci.custom.toLowerCase().includes(localizedEffectName);
  const sleeping = findTarget.actor[getEffects].find((i) => i[labelName] === condition);
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
      [labelName]: "Sleep Spell",
      img: "icons/svg/sleep.svg",
      origin: rolledItem.uuid,
      disabled: false,
      duration: { rounds: 10, seconds: 60, startRound: gameRound, startTime: game.time.worldTime },
      flags: { dae: { specialDuration: ["isDamaged"] } },
      statuses: ["unconscious"],
    };

    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: findTarget.actor.uuid, effects: [effectData] });
  } else {
    console.log(`Sleep Results => Target: ${target.name} | HP: ${targetHpValue} | HP Pool: ${remainingSleepHp - targetHpValue} | Status: Missed`);
    sleepTarget.push(`<div class="midi-qol-flex-container"><div>misses</div><div class="midi-qol-target-npc midi-qol-target-name" id="${findTarget.id}"> ${findTarget.name}</div><div><img src="${targetImg}" width="30" height="30" style="border:0px"></div></div>`);
  }
}
await DDBImporter?.EffectHelper.wait(500);
const sleptResults = `<div><div class="midi-qol-nobox">${sleepTarget.join('')}</div></div>`;
const chatMessage = game.messages.get(workflow.itemCardId);
let content = foundry.utils.duplicate(chatMessage.content);
const searchString = /<div class="midi-qol-hits-display">[\s\S]*<div class="end-midi-qol-hits-display">/g;
const replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${sleptResults}`;
content = content.replace(searchString, replaceString);
await chatMessage.update({ content: content });
