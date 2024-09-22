console.warn(scope)

const targetActor = (typeof actor !== 'undefined')
  ? actor
  : undefined;

const origin = item;

const scopeParameters = JSON.parse(scope.parameters ?? "\{\}");
const flag = scopeParameters.flag ?? "light";
const flagData = foundry.utils.getProperty(actor, `flags.world.${flag}`);

const lightConfig = scopeParameters.lightConfig ?? {};
const targetsToken = scopeParameters.targetsToken ?? false;
const distance = scopeParameters.distance ?? 15;

const isOn = !flagData?.active ?? true;
const isOff = flagData?.active ?? false;

const isSimpleDDBMacro = scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction");

console.warn("MACRO CALL", {
  scope,
  isSimpleDDBMacro,
  isOn,
  isOff,
  flagData,
  targetsToken,
  distance,
  lightConfig,
})

async function placeTemplate({ origin, targetActor, distance, flag } = {}) {
  Hooks.once("createMeasuredTemplate", async (template) => {
    let radius = canvas.grid.size * (template.distance / canvas.grid.distance);
    const params = {
      radius,
      x: template.x,
      y: template.y,
      distance: template.distance,
      targetActorId: targetActor.id,
      config: lightConfig,
      isTemplate: true,
    };
    await targetActor.update({
      [`flags.world.${flag}`]: {
        active: true,
        params,
      },
    });
    canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]);
    await DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "light", { origin: origin, effect: origin }, { args: ["on", params] });
  });

  const measureTemplateData = {
    t: "circle",
    user: game.userId,
    distance,
    direction: 0,
    x: 0,
    y: 0,
    fillColor: game.user.color,
    flags: {
      spellEffects: {
        Darkness: {
          ActorId: targetActor.id,
        },
      },
    },
  };

  const doc = new CONFIG.MeasuredTemplate.documentClass(measureTemplateData, { parent: canvas.scene });
  const measureTemplate = new game.dnd5e.canvas.AbilityTemplate(doc);
  measureTemplate.actorSheet = targetActor.sheet;
  measureTemplate.drawPreview();
}

if (isSimpleDDBMacro) {
  if (!actor || !item) {
    console.warn("no actor or item selected", actor, item);
    return;
  }
}


// handle template light
if (isOn && !targetsToken) {
  await placeTemplate({ origin, targetActor, distance, flag });
} else if (isOff && !targetsToken) {
  // const params = await DAE.getFlag(targetActor, "darknessSpell");
  DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "light", { actor: actor._id, token: token._id }, { args: ["off", flagData.params] });
  await targetActor.update({
    [`flags.world.${flag}`]: {
      active: false,
      params: null,
    },
  });
  // await DAE.unsetFlag(targetActor, "darknessSpell");
}

if (targetsToken) {
  const params = {
    targetActorId: targetActor.id,
    config: lightConfig,
    targetsToken: true,
    tokenUuids: dnd5e.utils.getTargetDescriptors().map(t => t.uuid),
  };

  if (isOn) {
    DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "light", { actor: actor._id, token: token._id }, { args: ["on", params] });

  } else if (isOff) {
    DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "light", { actor: actor._id, token: token._id }, { args: ["off", params] });
  }
}
