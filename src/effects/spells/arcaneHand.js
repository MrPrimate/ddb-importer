import DDBSummonsManager from "../../parser/companions/DDBSummonsManager.js";

export async function arcaneHandEffect(document) {
  const manager = new DDBSummonsManager();
  await manager.init();

  const summonActors = manager.itemHandler.compendium.index.filter((i) =>
    [
      "ArcaneHandRed",
      "ArcaneHandPurple",
      "ArcaneHandGreen",
      "ArcaneHandBlue",
      "ArcaneHandRock",
      "ArcaneHandRainbow",
    ].includes(i.flags?.ddbimporter?.summons?.summonsKey),
  );
  const profiles = summonActors
    .map((actor) => {
      return {
        _id: actor._id,
        name: actor.name,
        uuid: actor.uuid,
        count: 1,
      };
    });

  const summons = {
    "match": {
      "proficiency": false,
      "attacks": true,
      "saves": false,
    },
    "bonuses": {
      "ac": "",
      "hp": "@attributes.hp.max",
      "attackDamage": "",
      "saveDamage": "",
      "healing": "",
    },
    "profiles": profiles,
    "prompt": true,
  };

  foundry.utils.setProperty(document, "system.summons", summons);
  foundry.utils.setProperty(document, "system.actionType", "summ");

  return document;

}
