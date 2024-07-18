const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const DAEItem = lastArg.efData.flags.dae.itemData;

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
        blinding: "Blinding Sickness",
        callback: async () => {
          let data = {
            changes: [
              {
                key: "flags.midi-qol.disadvantage.ability.check.wis",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
              {
                key: "flags.midi-qol.disadvantage.ability.save.wis",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
            ],
            img: "icons/creatures/eyes/humanoid-single-blind.webp",
            label: "Blinding Sickness",
            name: "Blinding Sickness",
            _id: lastArg.effectId,
          };
          targetActor.updateEmbeddedDocuments("ActiveEffect", [data]);
        },
      },
      filth: {
        label: "Filth Fever",
        callback: async () => {
          let data = {
            changes: [
              {
                key: "flags.midi-qol.disadvantage.attack.mwak",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
              {
                key: "flags.midi-qol.disadvantage.attack.rwak",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
              {
                key: "flags.midi-qol.disadvantage.ability.check.str",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
              {
                key: "flags.midi-qol.disadvantage.ability.save.str",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
            ],
            label: "Filth Fever",
            name: "Filth Fever",
            _id: lastArg.effectId,
          };
          targetActor.updateEmbeddedDocuments("ActiveEffect", [data]);
        },
      },
      flesh: {
        label: "Flesh Rot",
        callback: async () => {
          let data = {
            changes: [
              {
                key: "flags.midi-qol.disadvantage.ability.check.cha",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
              {
                key: "system.traits.dv.all",
                mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                priority: 20,
                value: "1",
              },
            ],
            img: "icons/skills/wounds/injury-hand-blood-red.webp",
            label: "Flesh Rot",
            name: "Flesh Rot",
            _id: lastArg.effectId,
          };
          targetActor.updateEmbeddedDocuments("ActiveEffect", [data]);
        },
      },
      mindfire: {
        label: "Mindfire",
        callback: async () => {
          let data = {
            changes: [
              {
                key: "flags.midi-qol.disadvantage.ability.check.int",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
              {
                key: "flags.midi-qol.disadvantage.ability.save.int",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
            ],
            img: "icons/svg/daze.svg",
            label: "Mindfire",
            name: "Mindfire",
            _id: lastArg.effectId,
          };
          targetActor.updateEmbeddedDocuments("ActiveEffect", [data]);
        },
      },
      seizure: {
        label: "Seizure",
        callback: async () => {
          let data = {
            changes: [
              {
                key: "flags.midi-qol.disadvantage.attack.mwak",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
              {
                key: "flags.midi-qol.disadvantage.attack.rwak",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
              {
                key: "flags.midi-qol.disadvantage.ability.check.dex",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
              {
                key: "flags.midi-qol.disadvantage.ability.save.dex",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
            ],
            img: "icons/svg/paralysis.svg",
            label: "Seizure",
            name: "Seizure",
            _id: lastArg.effectId,
          };
          targetActor.updateEmbeddedDocuments("ActiveEffect", [data]);
        },
      },
      slimy: {
        label: "Slimy Doom",
        callback: async () => {
          let data = {
            changes: [
              {
                key: "flags.midi-qol.disadvantage.ability.check.con",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
              {
                key: "flags.midi-qol.disadvantage.ability.save.con",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: "1",
              },
            ],
            img: "icons/magic/unholy/projectile-helix-blood-red.webp",
            label: "Slimy Doom",
            name: "Slimy Doom",
            _id: lastArg.effecId,
          };
          targetActor.updateEmbeddedDocuments("ActiveEffect", [data]);
        },
      },
    },
  }).render(true);
}

/**
 * Execute contagion effects, update flag counts or remove effect
 *
 * @param {Actor5e} combatant Current combatant to test against
 * @param {Number} save Target DC for save
 */
async function contagionSave() {
  const flag = DAE.getFlag(targetActor, "ContagionSpell");
  const flavor = `${CONFIG.DND5E.abilities["con"].label} DC${flag.saveDC} ${DAEItem?.name || ""}`;
  const saveRoll = await targetActor.rollAbilitySave("con", { flavor });

  if (saveRoll.total < flag.saveDC) {
    if (flag.count === 2) {
      ChatMessage.create({ content: `Contagion on ${targetActor.name} is complete` });
      applyContagion();
    } else {
      const contagionCount = flag.count + 1;
      DAE.setFlag(targetActor, "ContagionSpell", { count: contagionCount });
      console.log(`Contagion increased to ${contagionCount}`);
    }
  } else if (saveRoll.total >= flag.saveDC) {
    targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
  }
}

if (args[0] === "on") {
  const saveData = DAEItem.system.save;
  if (saveData.scaling === "spell") {
    const rollData = actor.getRollData();
    saveData.dc = rollData.attributes.spelldc;
  }
  // Save the hook data for later access.
  DAE.setFlag(targetActor, "ContagionSpell", { count: 0, saveDC: saveData.dc });
}

if (args[0] === "off") {
  // When off, clean up hooks and flags.
  DAE.unsetFlag(targetActor, "ContagionSpell");
}

if (args[0] === "each") {
  let contagion = lastArg.efData;
  if ((contagion.name ?? contagion.label) === "Contagion") contagionSave();
}
