// This Macro is called by the Darkness spell so players can place walls and lights.

const darknessParams = args[args.length - 1];
const darkLightSupport = foundry.utils.isNewerVersion(game.version, 12);

function circleWall(cx, cy, radius) {
  let walls = [];
  const step = 30;
  for (let i = step; i <= 360; i += step) {
    let theta0 = Math.toRadians(i - step);
    let theta1 = Math.toRadians(i);

    let lastX = Math.floor((radius * Math.cos(theta0)) + cx);
    let lastY = Math.floor((radius * Math.sin(theta0)) + cy);
    let newX = Math.floor((radius * Math.cos(theta1)) + cx);
    let newY = Math.floor((radius * Math.sin(theta1)) + cy);

    walls.push({
      c: [lastX, lastY, newX, newY],
      move: CONST.WALL_MOVEMENT_TYPES.NONE,
      light: CONST.WALL_SENSE_TYPES.NORMAL,
      sight: CONST.WALL_SENSE_TYPES.NORMAL,
      sound: CONST.WALL_SENSE_TYPES.NONE,
      dir: CONST.WALL_DIRECTIONS.BOTH,
      door: CONST.WALL_DOOR_TYPES.NONE,
      ds: CONST.WALL_DOOR_STATES.CLOSED,
      flags: {
        spellEffects: {
          Darkness: {
            ActorId: darknessParams.targetActorId,
          },
        },
      },
    });
  }

  canvas.scene.createEmbeddedDocuments("Wall", walls);
}


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
    "reverse": false
  },
  "darkness": {
    "min": 0,
    "max": 1
  }
};

const TEMPLATE_LEGACY = {
  alpha: 0.5,
  angle: 0,
  bright: 15,
  coloration: 1,
  dim: 0,
  gradual: false,
  luminosity: -1,
  saturation: 0,
  contrast: 0,
  shadows: 0,
  animation: {
    speed: 5,
    intensity: 5,
    reverse: false,
  },
  darkness: {
    min: 0,
    max: 1,
  },
  color: null,
};


function darknessLight(cx, cy, radius) {

  const config = darkLightSupport
    ? TEMPLATE_DARK_LIGHT
    : TEMPLATE_LEGACY;

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
  if (!game.modules.get("perfect-vision")?.active && !darkLightSupport) circleWall(darknessParams.x, darknessParams.y, darknessParams.radius);
  darknessLight(darknessParams.x, darknessParams.y, darknessParams.distance);
}

if (args[0] == "off") {
  if (!game.modules.get("perfect-vision")?.active && !darkLightSupport) {
    const darkWalls = canvas.walls.placeables.filter((w) => w.document.flags?.spellEffects?.Darkness?.ActorId === darknessParams.targetActorId);
    const wallArray = darkWalls.map((w) => w.id);
    if (wallArray.length > 0) await canvas.scene.deleteEmbeddedDocuments("Wall", wallArray);
  }

  const darkLights = canvas.lighting.placeables.filter((w) => w.document.flags?.spellEffects?.Darkness?.ActorId === darknessParams.targetActorId);
  const lightArray = darkLights.map((w) => w.id);

  if (lightArray.length > 0) {
    await canvas.scene.deleteEmbeddedDocuments("AmbientLight", lightArray);
  }
}
