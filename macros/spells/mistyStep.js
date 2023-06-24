const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const tokenFromUuid = await fromUuid(lastArg.tokenUuid);
const targetToken = tokenFromUuid.data || token;

async function deleteTemplatesAndTeleport(destinationTemplate, actorId, flagName) {
  await targetToken.update({ x: destinationTemplate.data.x, y: destinationTemplate.data.y }, { animate: false });
  const templateIds = canvas.templates.placeables.filter(
    (i) => i.flags?.spellEffects?.[flagName] === actorId
  ).map((t) => t.id);
  await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", templateIds);
  const effectIds = targetActor.data.effects.filter((e) => (e.name ?? e.label) === "Misty Step").map((t) => t.id);
  await targetActor.deleteEmbeddedDocuments("ActiveEffect", effectIds);
}


if (args[0] === "on") {
  const rangeTemplateData = {
    t: "circle",
    user: game.userId,
    x: targetToken.x + (canvas.grid.size / 2),
    y: targetToken.y + (canvas.grid.size / 2),
    direction: 0,
    distance: 30,
    borderColor: "#FF0000",
    flags: {
      spellEffects: {
        MistyStep: targetActor.id,
      },
    },
  };
  await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [rangeTemplateData]);

  const templateData = {
    t: "rect",
    user: game.userId,
    distance: 7.5,
    direction: 45,
    x: 0,
    y: 0,
    fillColor: game.user.color,
    flags: {
      spellEffects: {
        MistyStep: targetActor.id,
      },
    },
  };

  // Hooks.once("createMeasuredTemplate", () => deleteTemplates(targetActor.id, "MistyStepRange"));
  const doc = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene });
  let template = new game.dnd5e.canvas.AbilityTemplate(doc);
  template.actorSheet = targetActor.sheet;

  Hooks.once("createMeasuredTemplate", () => deleteTemplatesAndTeleport(template, targetActor.id, "MistyStep"));
  template.drawPreview();
}

