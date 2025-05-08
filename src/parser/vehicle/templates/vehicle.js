import { utils } from "../../../lib/_module.mjs";

export function newVehicle(name, ddbId = null) {
  const options = {
    temporary: true,
    displaySheet: false,
  };
  const vehicleClass = new Actor.implementation({ name, type: "vehicle" }, options);
  let vehicle = vehicleClass.toObject();
  vehicle._id = ddbId === null
    ? foundry.utils.randomID()
    : utils.namedIDStub(vehicle.name, { postfix: ddbId });
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
