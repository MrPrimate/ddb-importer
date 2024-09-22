// This Macro is called by the Darkness spell so players can place walls and lights.

const parameters = args[args.length - 1];

const TEMPLATE_DARK_LIGHT = {
  "negative": true,
  "priority": 0,
  "alpha": 0.25,
  "angle": 360,
  "bright": 15,
  "color": null,
  "coloration": 1,
  "dim": 0,
  "attenuation": 0.5,
  "luminosity": 0.5,
  "saturation": 0,
  "contrast": 0,
  "shadows": 0,
  "animation": {
    "type": null,
    "speed": 5,
    "intensity": 5,
    "reverse": false,
  },
  "darkness": {
    "min": 0,
    "max": 1,
  },
};

const TEMPLATE_LIGHT_LIGHT = {
  "negative": false,
  "priority": 0,
  "alpha": 0.5,
  "angle": 360,
  "bright": 15,
  "color": null,
  "coloration": 1,
  "dim": 0,
  "attenuation": 0.5,
  "luminosity": 0.5,
  "saturation": 0,
  "contrast": 0,
  "shadows": 0,
  "animation": {
    "type": null,
    "speed": 5,
    "intensity": 5,
    "reverse": false,
  },
  "darkness": {
    "min": 0,
    "max": 1,
  },
};


function createLight(cx, cy, radius, darkness = false, flag = "light", overrides = {}) {

  let config = darkness
    ? TEMPLATE_DARK_LIGHT
    : TEMPLATE_LIGHT_LIGHT;

  config = foundry.utils.mergeObject(config, overrides);

  config.radius = radius;
  const lightTemplate = {
    x: cx,
    y: cy,
    rotation: 0,
    walls: false,
    vision: false,
    config,
    hidden: false,
    flags: {
      ddbEffects: {
        [`${flag}`]: {
          ActorId: parameters.targetActorId,
        },
      },
    },
  };
  canvas.scene.createEmbeddedDocuments("AmbientLight", [lightTemplate]);
}

const flag = parameters.flag ?? "light";

console.warn("GM CALL", {
  scope,
  parameters,
  args
})

if (parameters.isTemplate) {
  if (args[0] == "on") {
    createLight(parameters.x, parameters.y, parameters.distance, parameters.darkness, parameters.config ?? {});
  }

  if (args[0] == "off") {
    const darkLights = canvas.lighting.placeables.filter((w) =>
      foundry.utils.getProperty(w.document, `flags.ddbEffects.${flag}.ActorId`) === parameters.targetActorId,
    );
    const lightArray = darkLights.map((w) => w.id);

    if (lightArray.length > 0) {
      await canvas.scene.deleteEmbeddedDocuments("AmbientLight", lightArray);
    }
  }
} else if (parameters.targetsToken) {
  const token = await fromUuid(parameters.tokenUuid);
  const isApplied = foundry.utils.getProperty(token, `flags.world.${flag}`);

  if (isApplied && isApplied.enabled) {
    await token.update({
      light: isApplied.backup,
      [`flags.world.${flag}`]: {
        enabled: false,
        backup: null,
      },
    });
  } else {
    const currentLight = foundry.utils.getProperty(token, "light");
    console.warn(currentLight);

    const data = {
      light: parameters.lightConfig ?? {},
      [`flags.world.${flag}`]: {
        enabled: true,
        backup: foundry.utils.deepClone(currentLight),
      },
    };

    await token.update(data);
  }
}
