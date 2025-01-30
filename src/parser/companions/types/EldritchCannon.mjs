import { SUMMONS_ACTOR_STUB } from "./_data.mjs";

// eslint-disable-next-line no-unused-vars
const ELRITCH_CANNON_ABILITY_STUB = {
  "id": 1,
  "entityTypeId": 1120657896,
  "limitedUse": null,
  "name": "",
  "description": "",
  "snippet": "",
  "abilityModifierStatId": 1,
  "saveStatId": null,
  "attackTypeRange": 1,
  "actionType": 1,
  "attackSubtype": 3,
  "dice": null,
  "value": null,
  "damageTypeId": 1,
  "isMartialArts": false,
  "isProficient": true,
  "spellRangeType": null,
  "displayAsAttack": null,
  "range": null,
  "activation": {
    "activationTime": 1,
    "activationType": 1,
  },
  "componentId": 0,
  "componentTypeId": 0,
};

export function getEldritchCannonStub(size) {
  const cannon = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
    name: "Eldritch Cannon",
    img: "icons/weapons/guns/gun-blunderbuss-gold.webp",
    system: {
      "abilities": {
        "str": {
          "value": 10,
        },
        "dex": {
          "value": 10,
        },
        "con": {
          "value": 10,
        },
        "int": {
          "value": 10,
        },
        "wis": {
          "value": 10,
        },
        "cha": {
          "value": 10,
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
          "flat": 18,
          "calc": "flat",
        },
        "hp": {
          "value": 1,
          "max": 1,
        },
      },
      "traits": {
        "size": size,
      },
    },
    "prototypeToken": {
      "name": "Eldritch Cannon",
      "width": 0.5,
      "height": 0.5,
      "texture": {
        "src": "icons/weapons/guns/gun-blunderbuss-gold.webp",
      },
    },
  });
  return cannon;
}
