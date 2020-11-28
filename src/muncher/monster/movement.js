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
export function getSpeed (monster, DDB_CONFIG) {
  const movementConfig = DDB_CONFIG.movements;
  const monsterMovements = monster.movements;

  let values = "";
  let special = [];

  let movements = {
    burrow: 0,
    climb: 0,
    fly: 0,
    swim: 0,
    walk: 0,
    units: "ft",
    hover: false,
  };

  monsterMovements.forEach((monsterMovement) => {
    const movement = movementConfig.find((mv) => mv.id == monsterMovement.movementId);
    movements[movement.name.toLowerCase()] = monsterMovement.speed;

    if (monsterMovement.notes && monsterMovement.notes.toLowerCase().includes('hover')) movements.hover = true;

    if (movement.name == "Walk") {
      values = `${monsterMovement.speed}ft.`;
      if (monsterMovement.notes !== null) {
        special.push(`${monsterMovement.speed}ft. ${movement.description} (${monsterMovement.notes})`);
      }
    } else {
      const noteMovement = monsterMovement.notes ? ` ${monsterMovement.notes}` : "";
      const specialMovement = `${monsterMovement.speed}ft ${movement.description}${noteMovement}`;
      special.push(specialMovement);
    }
  });

  const speed = {
    value: values,
    special: special.join(", "),
  };

  return {
    speed: speed,
    movement: movements,
  };

}
