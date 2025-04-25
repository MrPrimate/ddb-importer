// This Macro is called by the Darkness spell so players can place walls and lights.

const darknessParams = args[args.length - 1];


function darknessLight(cx, cy, radius) {

  const config = {
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
      spellEffects: {
        Darkness: {
          ActorId: darknessParams.targetActorId,
        },
      },
      "perfect-vision": {
        resolution: 1,
        visionLimitation: {
          enabled: true,
          sight: 0,
          detection: {
            feelTremor: null,
            seeAll: null,
            seeInvisibility: 0,
            senseAll: null,
            senseInvisibility: null,
          },
        },
      },
    },
  };
  canvas.scene.createEmbeddedDocuments("AmbientLight", [lightTemplate]);
}

if (args[0] == "on") {
  darknessLight(darknessParams.x, darknessParams.y, darknessParams.distance);
}

if (args[0] == "off") {
  const darkLights = canvas.lighting.placeables.filter((w) => w.document.flags?.spellEffects?.Darkness?.ActorId === darknessParams.targetActorId);
  const lightArray = darkLights.map((w) => w.id);

  if (lightArray.length > 0) {
    await canvas.scene.deleteEmbeddedDocuments("AmbientLight", lightArray);
  }
}
