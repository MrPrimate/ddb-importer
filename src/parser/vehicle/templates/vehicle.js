export async function newVehicle(name) {
  const options = {
    temporary: true,
    displaySheet: false,
  };
  const vehicleClass = await Actor.create({ name, type: "vehicle" }, options);
  let vehicle = vehicleClass.toObject();
  const flags = {
    dnd5e: {},
    monsterMunch: {},
    ddbimporter: {
      dndbeyond: {},
    },
  };
  foundry.utils.setProperty(vehicle, "flags", flags);
  return vehicle;
};
