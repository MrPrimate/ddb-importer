// This Macro is called by the Darkness spell so players can place walls and lights.

const parameters = scope.parameters;

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


function createTemplateLight({ cx, cy, radius, darkness = false, flag = "light", overrides = {} } = {}) {

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
  console.warn("temaplate", lightTemplate)
  canvas.scene.createEmbeddedDocuments("AmbientLight", [lightTemplate]);
}

const flag = parameters.flag ?? "light";

console.warn("GM CALL", {
  scope,
  parameters,
})

if (parameters.isTemplate) {
  if (scope.toggle === "on") {
    createTemplateLight({
      cx: parameters.x,
      cy: parameters.y,
      radius: parameters.distance,
      darkness: parameters.darkness,
      overrides: parameters.config ?? {},
      flag,
    });
  }

  if (scope.toggle === "off") {
    const targetLights = canvas.lighting.placeables.filter((w) =>
      foundry.utils.getProperty(w.document, `flags.ddbEffects.${flag}.ActorId`) === parameters.targetActorId,
    );
    console.warn(targetLights)
    const lightArray = targetLights.map((w) => w.id);

    if (lightArray.length > 0) {
      await canvas.scene.deleteEmbeddedDocuments("AmbientLight", lightArray);
    }
  }
} else if (parameters.targetsToken) {
  for (const tokenUuid of parameters.tokenUuids) {
    const token = await fromUuid(tokenUuid);
    const isApplied = foundry.utils.getProperty(token, `flags.world.${flag}`);

    if (scope.toggle === "off" && isApplied?.enabled) {
      await token.update({
        light: isApplied.backup,
        [`flags.world.${flag}`]: {
          enabled: false,
          backup: null,
        },
      });
    } else if (scope.toggle === "on" && !isApplied?.enabled) {
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
}
