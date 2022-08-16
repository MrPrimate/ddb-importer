export const FLIGHT_IDS = [
  "7",
  "8",
];

const MOVEMENT_DICT = {
  "land": "walk",
  "water": "swim",
  "air": "fly",
  "magical": "Magical",
};

export function getMovement(ddb, configurations, movement) {

  // is it travel pace?
  if (configurations.ETP) {
    movement["units"] = "mi";
    const travelPaceMilesPerHour = ddb.travelPace / 5280;
    if (FLIGHT_IDS.includes(ddb.id) || configurations.DT === "spelljammer") {
      movement["fly"] = travelPaceMilesPerHour;
    } else {
      movement["swim"] = travelPaceMilesPerHour;
    }
  } else {
    const primaryComponent = ddb.components.find((c) => c.isPrimaryComponent);
    if (primaryComponent && primaryComponent.speeds && primaryComponent.speeds.length > 0) {
      movement["units"] = "ft";
      const type = MOVEMENT_DICT[primaryComponent.speeds[0].type];
      movement[type] = primaryComponent.speeds[0].modes[0].value;
    }

  }

  return movement;
}
