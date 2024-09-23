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
      overrides: parameters.lightConfig ?? {},
      flag,
    });
  }

  if (scope.toggle === "off") {
    const targetLights = canvas.lighting.placeables.filter((w) =>
      foundry.utils.getProperty(w.document, `flags.ddbEffects.${flag}.ActorId`) === parameters.parentActorId,
    );
    console.warn(targetLights);
    const lightArray = targetLights.map((w) => w.id);

    if (lightArray.length > 0) {
      await canvas.scene.deleteEmbeddedDocuments("AmbientLight", lightArray);
    }
  }
} else if (parameters.targetsToken) {
  if (scope.toggle === "on") {
    for (const tokenUuid of parameters.targetTokenUuids) {
      const token = await fromUuid(tokenUuid);
      if (!token) {
        console.warn(`Unable to find token for ${tokenUuid}`, { parameters });
        continue;
      }
      const isApplied = foundry.utils.getProperty(token, `flags.world.${flag}`);
      if (isApplied?.enabled) {
        console.info(`Light effect already applied to ${token.name}`);
        continue;
      }
      const currentLight = foundry.utils.getProperty(token, "light").toObject();

      const data = {
        light: parameters.lightConfig ?? {},
        [`flags.world.${flag}`]: {
          enabled: true,
          backup: foundry.utils.deepClone(currentLight),
        },
      };

      await token.update(data);
    }
  } else if (scope.toggle === "off") {
    for (const token of canvas.scene.tokens) {
      const isApplied = foundry.utils.getProperty(token, `flags.world.${flag}`);
      if (!isApplied || !isApplied.enabled) continue;
      await token.update({
        light: isApplied.backup,
        [`flags.world.${flag}`]: {
          enabled: false,
          backup: null,
        },
      });
    }
  }
}
