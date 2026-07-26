import { logger } from "../../lib/_module";
import DDBMonster from "../DDBMonster";

// "movements": [
//   {
//     "movementId": 1,
//     "speed": 40,
//     "notes": null
// },
// {
//     "movementId": 4,
//     "speed": 80,
//     "notes": null
// },
// {
//     "movementId": 5,
//     "speed": 40,
//     "notes": null
// }
// ],

// "speed": {
//   "value": "40 ft.",
//   "special": "Fly 80 ft., Swim 40 ft."
// },
DDBMonster.prototype._generateMovement = function (this: DDBMonster) {
  const special: string[] = [];

  const npcMovement = this.npc.system.attributes?.movement;
  if (!npcMovement) {
    logger.warn(`_generateMovement: missing npc movement attribute for ${this.source.name}`);
    return;
  }
  npcMovement.units = "ft";

  this.source.movements.forEach((monsterMovement) => {
    const movement = CONFIG.DDB.movements.find((mv) => mv.id == monsterMovement.movementId);
    if (!movement) {
      logger.warn(`_generateMovement: unknown movement id ${monsterMovement.movementId} for ${this.source.name}`);
    }
    const movementName: I5eMovementType = movement?.name.toLowerCase() as I5eMovementType ?? "walk";
    npcMovement[movementName] = String(monsterMovement.speed);

    if (monsterMovement.notes && monsterMovement.notes.toLowerCase().includes("hover")) {
      npcMovement.hover = true;
    }

    if (movement && monsterMovement.notes?.trim() !== "") {
      const specialMovement = `${monsterMovement.speed}ft ${movement.description} (${monsterMovement.notes})`;
      special.push(specialMovement);
    }
  });

  this.movement = {
    movement: npcMovement,
    special,
  };

};
