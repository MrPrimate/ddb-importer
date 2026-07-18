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

  this.npc.system.attributes.movement.units = "ft";

  this.source.movements.forEach((monsterMovement) => {
    const movement = CONFIG.DDB.movements.find((mv) => mv.id == monsterMovement.movementId);
    const movementName: I5eMovementType = movement?.name.toLowerCase() as I5eMovementType ?? "walk";
    this.npc.system.attributes.movement[movementName] = String(monsterMovement.speed);

    if (monsterMovement.notes && monsterMovement.notes.toLowerCase().includes("hover")) {
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
