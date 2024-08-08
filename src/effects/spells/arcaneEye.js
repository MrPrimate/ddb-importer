import DDBSummonsManager from "../../parser/companions/DDBSummonsManager.js";

export async function arcaneEyeEffect(document) {
  const manager = new DDBSummonsManager();
  await manager.init();

  const summonActors = manager.itemHandler.compendium.index.filter((i) =>
    [
      "ArcaneEye",
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
      "attacks": false,
      "saves": false,
    },
    "bonuses": {
      "ac": "",
      "hp": "",
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
