const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

console.warn("2024", {
  item,
  scope,
  args,
});

/**
 * Generates the GM client dialog for selecting final Effect, updates target effect with name, icon and new DAE effects.
 */
async function applyContagion() {
  const buttons = {};

  for (const [key, data] of Object.entries(CONFIG.DND5E.abilities)) {
    buttons[key] = {
      label: data.label,
      callback: async () => {
        let effect = {
          changes: [
            {
              key: `flags.midi-qol.disadvantage.ability.save.${key}`,
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              priority: 20,
              value: "1",
            },
          ],
          img: data.icon,
          name: `${item.name}: ${data.label}`,
          origin: scope.effect.origin,
        };
        targetActor.createEmbeddedDocuments("ActiveEffect", [effect]);
      },
    };
  }

  new Dialog({
    title: "Contagion options",
    content: "<p>Select the ability</p>",
    buttons,
  }).render(true);
}

/**
 * Execute contagion effects, update flag counts or remove effect
 */
async function contagionSave() {
  const flag = DAE.getFlag(targetActor, "ContagionSpell");
  const flavor = `${CONFIG.DND5E.abilities["con"].label} DC${flag.saveDC} ${item?.name || ""}`;
  const saveRoll = await targetActor.rollAbilitySave("con", { flavor });

  // todo: adjust count for success and failures
  // don't delete effect

  if (saveRoll.total > flag.saveDC) {
    flag.success += 1;
  } else {
    flag.failures += 1;
  }
  DAE.setFlag(targetActor, "ContagionSpell", flag);
  console.log(`Contagion counters are ${flag.success} successes and ${flag.failures} failures`);


  if (saveRoll.total < flag.saveDC) {
    if (flag.count === 2) {
      ChatMessage.create({ content: `Contagion on ${targetActor.name} is complete` });
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
  // Save the hook data for later access.
  DAE.setFlag(targetActor, "ContagionSpell", { success: 0, failures: 0, saveDC: scope.macroActivity.save.dc.value });
  applyContagion();
}

if (args[0].tag == "OnUse") {
  console.warn({
    workflow,
    scope,
  });
}

if (args[0] === "off") {
  // When off, clean up hooks and flags.
  DAE.unsetFlag(targetActor, "ContagionSpell");
}

if (args[0] === "each") {
  let contagion = lastArg.efData;
  if (contagion.name === "Contagion") contagionSave();
}
