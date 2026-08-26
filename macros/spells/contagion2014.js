const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const DAEItem = lastArg.efData.flags.dae.itemData;

console.warn("2014", {
  scope,
  args,
  item,
  actor,
  targetActor,
  DAEItem,
});

/**
 * Generates the GM client dialog for selecting final Effect, updates target effect with name, icon and new DAE effects.
 */
async function applyContagion() {
  if (DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("Poisoned", targetActor))
    DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "Poisoned", actor: targetActor });

  new Dialog({
    title: "Contagion options",
    content: "<p>Select the effect</p>",
    buttons: {
      one: {
        label: "Blinding Sickness",
        callback: async () => {
          let data = {
            "system.changes": [
              {
                key: `system.abilities.wis.check.roll.mode`,
                type: "add",
                priority: 20,
                value: `${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`,
              },
              {
                key: `system.abilities.wis.save.roll.mode`,
                type: "add",
                priority: 20,
                value: `${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`,
              },
            ],
            img: "icons/creatures/eyes/humanoid-single-blind.webp",
            name: "Blinding Sickness",
            _id: lastArg.effectId,
          };
          await DDBImporter.socket.executeAsGM("updateEffects", {
            actorUuid: targetActor.uuid,
            updates: [data],
          });
        },
      },
      filth: {
        label: "Filth Fever",
        callback: async () => {
          let data = {
            "system.changes": [
              {
                key: "flags.midi-qol.disadvantage.attack.mwak",
                type: "override",
                priority: 20,
                value: "1",
              },
              {
                key: "flags.midi-qol.disadvantage.attack.rwak",
                type: "override",
                priority: 20,
                value: "1",
              },
              {
                key: `system.abilities.str.check.roll.mode`,
                type: "add",
                priority: 20,
                value: `${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`,
              },
              {
                key: `system.abilities.str.save.roll.mode`,
                type: "add",
                priority: 20,
                value: `${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`,
              },
            ],
            name: "Filth Fever",
            _id: lastArg.effectId,
          };
          await DDBImporter.socket.executeAsGM("updateEffects", {
            actorUuid: targetActor.uuid,
            updates: [data],
          });
        },
      },
      flesh: {
        label: "Flesh Rot",
        callback: async () => {
          let data = {
            "system.changes": [
              {
                key: "flags.midi-qol.disadvantage.ability.check.cha",
                type: "override",
                priority: 20,
                value: "1",
              },
              {
                key: "system.traits.dv.all",
                type: "custom",
                priority: 20,
                value: "1",
              },
            ],
            img: "icons/skills/wounds/injury-hand-blood-red.webp",
            name: "Flesh Rot",
            _id: lastArg.effectId,
          };
          await DDBImporter.socket.executeAsGM("updateEffects", {
            actorUuid: targetActor.uuid,
            updates: [data],
          });
        },
      },
      mindfire: {
        label: "Mindfire",
        callback: async () => {
          let data = {
            "system.changes": [
              {
                key: `system.abilities.int.check.roll.mode`,
                type: "add",
                priority: 20,
                value: `${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`,
              },
              {
                key: `system.abilities.int.save.roll.mode`,
                type: "add",
                priority: 20,
                value: `${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`,
              },
            ],
            img: "icons/svg/daze.svg",
            name: "Mindfire",
            _id: lastArg.effectId,
          };
          await DDBImporter.socket.executeAsGM("updateEffects", {
            actorUuid: targetActor.uuid,
            updates: [data],
          });
        },
      },
      seizure: {
        label: "Seizure",
        callback: async () => {
          let data = {
            "system.changes": [
              {
                key: "flags.midi-qol.disadvantage.attack.mwak",
                type: "override",
                priority: 20,
                value: "1",
              },
              {
                key: "flags.midi-qol.disadvantage.attack.rwak",
                type: "override",
                priority: 20,
                value: "1",
              },
              {
                key: `system.abilities.dex.check.roll.mode`,
                type: "add",
                priority: 20,
                value: `${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`,
              },
              {
                key: `system.abilities.dex.save.roll.mode`,
                type: "add",
                priority: 20,
                value: `${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`,
              },
            ],
            img: "icons/svg/paralysis.svg",
            name: "Seizure",
            _id: lastArg.effectId,
          };
          await DDBImporter.socket.executeAsGM("updateEffects", {
            actorUuid: targetActor.uuid,
            updates: [data],
          });
        },
      },
      slimy: {
        label: "Slimy Doom",
        callback: async () => {
          let data = {
            "system.changes": [
              {
                key: `system.abilities.con.check.roll.mode`,
                type: "add",
                priority: 20,
                value: `${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`,
              },
              {
                key: `system.abilities.con.save.roll.mode`,
                type: "add",
                priority: 20,
                value: `${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`,
              },
            ],
            img: "icons/magic/unholy/projectile-helix-blood-red.webp",
            name: "Slimy Doom",
            _id: lastArg.effectId,
          };
          await DDBImporter.socket.executeAsGM("updateEffects", {
            actorUuid: targetActor.uuid,
            updates: [data],
          });
        },
      },
    },
  }).render(true);
}

/**
 * Execute contagion effects, update flag counts or remove effect
 *
 */
async function contagionSave() {
  const flag = DAE.getFlag(targetActor, "ContagionSpell");
  const flavor = `${CONFIG.DND5E.abilities["con"].label} DC${flag.saveDC} ${DAEItem?.name || ""}`;
  const saveRolls = await targetActor.rollSavingThrow({ ability: "con" }, {}, { data: { flavor } });
  const saveRoll = saveRolls?.[0];
  if (!saveRoll) return;

  if (saveRoll.total >= flag.saveDC) {
    flag.success += 1;
  } else {
    flag.failure += 1;
  }
  DAE.setFlag(targetActor, "ContagionSpell", flag);
  console.log(`Contagion counters are ${flag.success} successes and ${flag.failure} failures`);

  if (flag.failure >= 3) {
    ChatMessage.create({ content: `3 ${item.name} save failures on ${targetActor.name}, preparing sicknes...` });
    applyContagion();
  } else if (flag.success >= 3) {
    ChatMessage.create({ content: `3 ${item.name} save successes on ${targetActor.name}, the spell ends.` });
    targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
  } else {
    ChatMessage.create({ content: `${targetActor.name} saves for ${item.name}: ${flag.failure} failures, ${flag.success} successes.` });
  }
}

if (args[0] === "on") {
  // Save the hook data for later access.
  DAE.setFlag(targetActor, "ContagionSpell", {
    success: 0,
    failure: 0,
    saveDC: scope.macroItem.system.activities.get("ddbContagionSave").save.dc.value,
  });
}

if (args[0] === "off") {
  // When off, clean up hooks and flags.
  DAE.unsetFlag(targetActor, "ContagionSpell");
}

if (args[0] === "each") {
  contagionSave();
}
