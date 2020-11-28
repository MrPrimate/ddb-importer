
export function getEnvironments(monster, DDB_CONFIG) {
  const environments = monster.environments.map((env) => {
    return DDB_CONFIG.environments.find((c) => env == c.id).name;
  });

  return environments.join(", ");
}
