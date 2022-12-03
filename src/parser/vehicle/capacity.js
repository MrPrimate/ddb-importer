export function getCapacity(ddb) {
  let capacity = {
    creature: "",
    cargo: null,
  };

  if (ddb.cargoCapacity) {
    capacity.cargo = ddb.cargoCapacity;
  }

  if (ddb.creatureCapacity && ddb.creatureCapacity.length > 0) {
    const capacityStrings = ddb.creatureCapacity.map((c) => {
      const size = c.sizeId
        ? `${CONFIG.DDB.creatureSizes.find((s) => s.id == c.sizeId).name.toLowerCase()} `
        : "";

      return `${c.capacity} ${size}${c.type}`;
    });
    capacity.creature = capacityStrings.join(", ");
  }

  return capacity;
}
