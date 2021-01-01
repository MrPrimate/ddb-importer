// import DICTIONARY from "../../dictionary.js";
// import logger from "../../logger.js";

/**
 * Some features we need to fix up or massage because they are modified
 * in interesting ways
 * @param {*} ddb
 * @param {*} features
 */
export function fixFeatures(features) {
  features.forEach((feature) => {
    switch (feature.name) {
      case "Second Wind":
        feature.data.damage = { parts: [["1d10 + @classes.fighter.levels", "healing"]], versatile: "", value: "" };
        feature.data.actionType = "heal";
        feature.data['target']['type'] = "self";
        feature.data['range']['type'] = "self";
        break;
      case "Stone's Endurance":
      case "Stone’s Endurance":
        feature.data.damage = { parts: [["1d12 + @mod", ""]], versatile: "", value: "" };
        feature.data.actionType = "other";
        feature.data.ability = "con";
        feature.data['target']['type'] = "self";
        feature.data['range']['type'] = "self";
        break;
      // add a rage effect
      case "Rage":
        feature.effects = [
          {
            "flags": {
              "dae": {
                "transfer": false,
                "stackable": false
              }
            },
            "changes": [
              {
                "key": "data.bonuses.mwak.damage",
                "value": "2",
                "mode": 0,
                "priority": 0
              },
              {
                "key": "data.traits.dr.value",
                "value": "piercing",
                "mode": 0,
                "priority": 0
              },
              {
                "key": "data.traits.dr.value",
                "value": "slashing",
                "mode": 0,
                "priority": 20
              },
              {
                "key": "data.traits.dr.value",
                "value": "bludgeoning",
                "mode": 0,
                "priority": 20
              }
            ],
            "disabled": false,
            "duration": {
              "startTime": null,
              "seconds": null,
              "rounds": null,
              "turns": null,
              "startRound": null,
              "startTurn": null
            },
            "icon": "systems/dnd5e/icons/skills/red_10.jpg",
            "label": "Rage",
            "tint": "",
            "transfer": false
          }
        ];
      // no default
    }
  });
}
