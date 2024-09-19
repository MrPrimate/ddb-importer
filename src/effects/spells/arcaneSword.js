import DDBSummonsManager from "../../parser/companions/DDBSummonsManager.js";

export async function arcaneSwordEffect(document) {
  const manager = new DDBSummonsManager();
  await manager.init();

  const summonActors = manager.itemHandler.compendium.index.filter((i) =>
    [
      "ArcaneSwordSpectralGreen",
      "ArcaneSwordAstralBlue",
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
  document.system.damage = { parts: [], versatile: "", value: "" };

  return document;

}
