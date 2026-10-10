

// const lastArg = args[args.length - 1];
// const tokenOrActor = await fromUuid(lastArg.actorUuid);
// const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
// const tokenFromUuid = await fromUuid(lastArg.tokenUuid);
// const targetToken = tokenFromUuid.data || token;

const targetActor = actor;
const targetToken = token;

console.warn({scope, targetActor, targetToken});

// Foundry 14 keeps templates as Regions (with their flags) and its template layer has no live
// placeables, so the spell's templates are found among the scene's regions.
async function deleteTemplates(actorId, flagName) {
  const regionIds = canvas.scene.regions
    .filter((region) => region.flags?.spellEffects?.[flagName] === actorId)
    .map((region) => region.id);
  if (regionIds.length > 0) await canvas.scene.deleteEmbeddedDocuments("Region", regionIds);
}

async function deleteTemplatesAndTeleport(destinationTemplate, actorId, flagName) {
  await targetToken.update({ x: destinationTemplate.document.x, y: destinationTemplate.document.y }, { animate: false });
  await deleteTemplates(actorId, flagName);
}

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

const doc = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene });
let template = new game.dnd5e.canvas.AbilityTemplate(doc);
template.actorSheet = targetActor.sheet;

// Foundry 14 never fires createMeasuredTemplate; dnd5e 5.3's drawPreview resolves with the placed
// template (and rejects on cancel, which only clears the range marker)
let placed = null;
try {
  [placed] = await template.drawPreview();
} catch {
  // cancelled
}
if (placed) await deleteTemplatesAndTeleport(template, targetActor.id, "MistyStep");
else await deleteTemplates(targetActor.id, "MistyStep");
