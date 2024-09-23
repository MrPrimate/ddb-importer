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
      flag,
    };
    await targetActor.update({
      [`flags.world.${flag}`]: {
        active: true,
        params,
      },
    });
    canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]);
    await DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "light", { origin: origin, effect: origin }, { toggle: "on", parameters: params });
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

// const position = await DDBImporter.lib.Crosshairs.aimCrosshair({
//   drawBoundries: false,
//   trackDistance: false,
// });

if (isOff) {

  ui.notifications.info("Attempting to remove previous casting effects");

  DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "light", { actor: actor._id }, { toggle: "off", parameters: flagData.params });
  await targetActor.update({
    [`flags.world.${flag}`]: {
      active: false,
      params: null,
    },
  });

} else if (isOn) {

  if (targetsToken) {
    const params = {
      targetActorId: targetActor.id,
      config: lightConfig,
      targetsToken: true,
      flag,
      tokenUuids: dnd5e.utils.getTargetDescriptors().map(t => t.uuid),
    };

    if (params.tokenUuids.length === 0) {
      ui.notifications.warn('Please target a token to apply the light effect to and try again.');
      return;
    }

    await targetActor.update({
      [`flags.world.${flag}`]: {
        active: true,
        params,
      },
    });
    DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "light", { actor: actor._id }, { toggle: "on", parameters: params });
  } else {
    await placeTemplate({ origin, targetActor, distance, flag });
  }

}

