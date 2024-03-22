// DAE Item Macro, pass spell level
const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const tokenFromUuid = await fromUuid(lastArg.tokenUuid);
const targetToken = tokenFromUuid.data || token;
const DAEItem = lastArg.efData.flags.dae.itemData;
const saveData = DAEItem.system.save;
const saveDC = (saveData.dc === null || saveData.dc === "") && saveData.scaling === "spell"
  ? (await fromUuid(lastArg.efData.origin)).parent.getRollData().attributes.spelldc
  : saveData.dc;
const castItemName = "Moonbeam Attack";
const castItem = targetActor.items.find((i) => i.name === castItemName && i.type === "spell");

async function deleteTemplateIds(templateIds) {
  console.log("Deleting template ids", templateIds);
  await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", templateIds);
}

async function deleteTemplates(actorId, flagName) {
  const templateIds = canvas.templates.placeables.filter(
    (i) => i.data.flags?.spellEffects?.[flagName] === actorId
  ).map((t) => t.id);
  if (templateIds.length > 0) await deleteTemplateIds(templateIds);
}

async function getTemplateId(template, caster) {
  await DAE.setFlag(caster, "moonBeamSpell.template", template.id);
}

async function placeMoonBeam(casterActor, range, originObject, deleteOriginTemplate = false) {
  // create range template
  const isTemplate = originObject instanceof MeasuredTemplate;
  await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{
    t: "circle",
    user: game.userId,
    x: isTemplate ? originObject.x : originObject.x + (canvas.grid.size / 2),
    y: isTemplate ? originObject.y : originObject.y + (canvas.grid.size / 2),
    direction: 0,
    distance: range,
    borderColor: "#517bc9",
    flags: {
      spellEffects: {
        MoonbeamRange: casterActor.id,
      }
    }
  }]);

  const templateData = {
    t: "circle",
    user: game.userId,
    distance: 5,
    direction: 0,
    x: 0,
    y: 0,
    flags: {
      spellEffects: {
        Moonbeam: casterActor.id,
      }
    },
    fillColor: game.user.color
  };
  Hooks.once("createMeasuredTemplate", () => deleteTemplates(casterActor.id, "MoonbeamRange"));
  Hooks.once("createMeasuredTemplate", (template) => getTemplateId(template, casterActor));
  if (deleteOriginTemplate) Hooks.once("createMeasuredTemplate", () => deleteTemplateIds([originObject.id]));

  const doc = new MeasuredTemplateDocument(templateData, { parent: canvas.scene });
  const template = new game.dnd5e.canvas.AbilityTemplate(doc);
  template.actorSheet = casterActor.sheet;
  template.drawPreview();
}

if (args[0] === "on") {
  // place templates
  await placeMoonBeam(targetActor, 120, targetToken);
  const spellLevel = args[1];

  if (!castItem) {
    const spell = {
      name: castItemName,
      type: "spell",
      system: {
        description: DAEItem.system.description,
        activation: { type: "action", },
        ability: DAEItem.system.ability,
        attack: {
          bonus: DAEItem.system.attack.bonus,
        },
        actionType: "save",
        damage: { parts: [[`${spellLevel}d10`, "radiant"]], versatile: "", },
        formula: "",
        save: { ability: "con", dc: saveDC, scaling: "spell" },
        level: 0,
        school: DAEItem.system.school,
        preparation: { mode: "prepared", prepared: false, },
        scaling: { mode: "none", formula: "", },
      },
      img: DAEItem.img,
      flags: { ddbimporter: { ignoreItemUpdate: true } },
      effects: [],
    };
    await targetActor.createEmbeddedDocuments("Item", [spell]);
    ui.notifications.notify("Moonbeam attack created in your spellbook");
  }
}

if (args[0] === "each") {
  new Dialog({
    title: "Moonbeam options",
    content: "<p>Use action to move Moonbeam?</p>",
    buttons: {
      yes: {
        label: "Yes",
        callback: async () => {
          const originalTemplateId = await DAE.getFlag(targetActor, "moonBeamSpell.template");
          if (originalTemplateId) {
            const originalTemplate = canvas.templates.placeables.find((t) => t.id === originalTemplateId);
            await placeMoonBeam(targetActor, 60, originalTemplate, true);
          } else {
            await placeMoonBeam(targetActor, 120, targetToken);
          }
        }
      },
      no: {
        label: "No",
        callback: () => {
          console.log("Moonbeam remains where it is.");
        }
      }
    },
  }).render(true);
}

// Delete Moonbeam
if (args[0] === "off") {
  if (castItem) targetActor.deleteEmbeddedDocuments("Item", [castItem.id]);
  deleteTemplates(targetActor.id, "Moonbeam");
  DAE.unsetFlag(targetActor, "moonBeamSpell");
}
