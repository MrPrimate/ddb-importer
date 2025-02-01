
export function SUMMONS_ACTOR_STUB() {
  return {
    "type": "npc",
    "system": {
      "abilities": {
        "str": {
          "value": 100,
        },
        "dex": {
          "value": 100,
        },
        "con": {
          "value": 100,
        },
        "int": {
          "value": 100,
        },
        "wis": {
          "value": 100,
        },
        "cha": {
          "value": 100,
        },
      },
      "attributes": {
        "movement": {
          "burrow": null,
          "climb": null,
          "fly": null,
          "swim": null,
          "walk": null,
          "units": null,
          "hover": true,
        },
        "ac": {
          "flat": 1000,
          "calc": "flat",
        },
        "hp": {
          "value": 1000,
          "max": 1000,
          "temp": 0,
          "tempmax": 0,
          "bonuses": {},
        },
      },
      "traits": {
        "size": "tiny",
        ci: {
          value: Object.keys(CONFIG.DND5E.conditionTypes),
        },
        di: {
          value: Object.keys(CONFIG.DND5E.damageTypes),
        },
      },
    },
    "items": [],
    "effects": [],
    "folder": null,
    "prototypeToken": {
      "actorLink": false,
      "appendNumber": true,
      "prependAdjective": false,
      "width": 0.5,
      "height": 0.5,
      "texture": {
        "anchorX": 0.5,
        "anchorY": 0.5,
        "offsetX": 0,
        "offsetY": 0,
        "fit": "contain",
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "tint": "#ffffff",
        "alphaThreshold": 0.75,
      },
      "hexagonalShape": 0,
      "lockRotation": false,
      "rotation": 0,
      "alpha": 1,
      "disposition": CONST.TOKEN_DISPOSITIONS.SECRET,
      "displayBars": 0,
      "bar1": {
        "attribute": null,
      },
      "bar2": {
        "attribute": null,
      },
      "ring": {
        "enabled": false,
      },
      "randomImg": false,
    },
  };
};
