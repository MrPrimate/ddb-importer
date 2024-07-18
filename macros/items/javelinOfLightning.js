// based on a macro by @Chris#8375
if (["on", "off"].includes(args[0])) {
  const lastArg = args[args.length - 1];
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  const item = targetActor.items.find((i) => i.name === args[1]);
  if (item) {
    if (args[0] === "off") await item.setFlag("world", "boltUsed", false);
    await item.setFlag("world", "useBolt", false);
  }
  return;
}

const workflow = args[0].workflow;

if (workflow.targets.size === 0) return;

async function useBolt() {
  return new Promise((resolve) => {
    new Dialog({
      title: "Use Bolt of Lightning?",
      content: "<p>Use Bolt of Lightning?</p>",
      buttons: {
        yes: {
          label: "Yes",
          callback: async () => {
            await workflow.item.setFlag("world", "useBolt", true);
            resolve(this);
          },
        },
        no: {
          label: "No",
          callback: async () => {
            resolve(this);
          },
        },
      },
    }).render(true);
  });
}

if (args[0].macroPass === "postActiveEffects") {
  if (!workflow.item.flags.world?.useBolt) return;
  const targetToken = workflow.targets.first();
  const sourceToken = workflow.token;
  await workflow.item.setFlag("world", "boltUsed", true);
  const ray = new Ray(sourceToken.center, targetToken.center);
  if (ray.distance === 0) return;
  const templateData = {
    angle: 0,
    direction: Math.toDegrees(ray.angle),
    distance: (ray.distance / canvas.scene.grid.size) * 5,
    x: ray.A.x,
    y: ray.A.y,
    t: "ray",
    user: game.user,
    fillColor: game.user.color,
    width: 5,
    flags: {
      tokenmagic: {
        options: {
          tmfxPreset: "Shock",
          tmfxTextureAlpha: 0.5,
        },
      },
    },
  };
  const changes = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [templateData]);
  await DDBImporter?.EffectHelper.wait(500);
  const templateDoc = changes[0];
  // console.warn("TEMPLATE", templateDoc);
  const boltEffectData = {
    label: `${workflow.item.name}: Bolt Template`,
    name: `${workflow.item.name}: Bolt Template`,
    img: "icons/magic/lightning/bolt-forked-large-blue-yellow.webp",
    changes: [
      {
        key: "flags.dae.deleteUuid",
        mode: 5,
        priority: 20,
        value: templateDoc.uuid,
      },
    ],
    duration: {
      seconds: 1,
    },
  };
  await await MidiQOL.socket().executeAsGM("createEffects", {
    actorUuid: sourceToken.actor.uuid,
    effects: [boltEffectData],
  });
  const templateTokenIds = DDBImporter?.EffectHelper.findContainedTokensInTemplate(templateDoc) ?? [];

  const targetTokens = [];
  for (const i of templateTokenIds) {
    if (i === sourceToken.id || i === targetToken.id) continue;
    targetTokens.push(canvas.scene.tokens.get(i).uuid);
  }

  if (targetTokens.length > 0) {
    const lightningBoltData = foundry.utils.duplicate(workflow.item);
    delete lightningBoltData.effects;
    delete lightningBoltData._id;
    delete lightningBoltData.flags["midi-qol"].onUseMacroName;
    delete lightningBoltData.flags["midi-qol"].onUseMacroParts;
    if (foundry.utils.hasProperty(lightningBoltData, "flags.itemacro")) delete lightningBoltData.flags.itemacro;
    if (foundry.utils.hasProperty(lightningBoltData, "flags.dae.macro")) delete lightningBoltData.flags.dae.macro;
    lightningBoltData.name +=  ": Bolt";
    lightningBoltData.system.damage.parts = [["4d6[lightning]", "lightning"]];
    lightningBoltData.system.actionType = "save";
    lightningBoltData.system.save.ability = "dex";
    lightningBoltData.system.save.dc = 13;
    lightningBoltData.system.save.scaling = "flat";
    const areaSpell = new CONFIG.Item.documentClass(lightningBoltData, { parent: workflow.actor });
    const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions({ targets: targetTokens });

    // console.warn("Midi Options", {
    //   areaSpell,
    //   options,
    //   targetTokens,
    //   lightningBoltData,
    // })
    await MidiQOL.completeItemUse(areaSpell, config, options);
  }
} else if (args[0].macroPass === "postDamageRoll") {
  if (!workflow.item.flags.world?.useBolt) return;
  const diceNum = workflow.isCritical ? 8 : 4;
  const formula = `${workflow.damageRoll._formula} + ${diceNum}d6[lightning]`;
  const damageRoll = await new CONFIG.Dice.DamageRoll(formula).roll({ async: true });
  await workflow.setDamageRoll(damageRoll);
} else if (args[0].macroPass === "preAttackRoll") {
  if (workflow.item.getFlag("world", "boltUsed")) return;
  await useBolt();
}
