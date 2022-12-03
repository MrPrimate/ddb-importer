
export function getEnvironments(monster) {
  const environments = monster.environments.filter((env) =>
    CONFIG.DDB.environments.some((c) => env == c.id)
  ).map((env) => {
    return CONFIG.DDB.environments.find((c) => env == c.id).name;
  });

  return environments.join(", ");
}
