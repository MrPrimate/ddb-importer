import DDBMonster from "../DDBMonster.js";

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
DDBMonster.prototype._generateMovement = function () {
  let special = [];

  this.npc.system.attributes.movement.units = "ft";

  this.source.movements.forEach((monsterMovement) => {
    const movement = CONFIG.DDB.movements.find((mv) => mv.id == monsterMovement.movementId);
    this.npc.system.attributes.movement[movement.name.toLowerCase()] = monsterMovement.speed;

    if (monsterMovement.notes && monsterMovement.notes.toLowerCase().includes('hover')) {
      this.npc.system.attributes.movement.hover = true;
    }

    if (monsterMovement.notes?.trim() !== "") {
      const specialMovement = `${monsterMovement.speed}ft ${movement.description} (${monsterMovement.notes})`;
      special.push(specialMovement);
    }
  });

  this.movement = {
    movement: this.npc.system.attributes.movement,
    special,
  };

};
