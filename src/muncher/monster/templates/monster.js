import utils from '../../../utils.js';

export function newNPC(name) {
  let npc = {
    name: name,
    type: "npc",
    data: JSON.parse(utils.getTemplate("npc")),
    flags: {
      dnd5e: {},
      monsterMunch: {},
      ddbimporter: {
        dndbeyond: {},
      },
    },
    img: "icons/svg/mystery-man.svg",
    items: [],
    effects: [],
    token: {
      "flags": {},
      "name": name,
      "displayName": 20,
      "img": "icons/svg/mystery-man.svg",
      "width": 1,
      "height": 1,
      "scale": 1,
      "vision": true,
      "dimSight": 0,
      "brightSight": 0,
      "dimLight": 0,
      "brightLight": 0,
      "sightAngle": 360,
      "lightAngle": 360,
      "disposition": -1,
      "displayBars": 40,
      "bar1": {
        "attribute": "attributes.hp"
      },
      "randomImg": false
    },
  };
  return npc;
};
