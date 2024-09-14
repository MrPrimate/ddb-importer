
const flag = "innerRadiance";
const bright = 10;
const dim = 20;

const isApplied = foundry.utils.getProperty(token, `flags.world.${flag}`);

if (isApplied && isApplied.enabled) {
  await token.update({
    light: isApplied.backup,
    [`flags.world.${flag}`]: {
      enabled: false,
      backup: null,
    },
  });
} else {
  const currentLight = foundry.utils.getProperty(token, "light");
  console.warn(currentLight);

  const data = {
    light: {
      bright,
      dim,
      color: "#ffffff",
      alpha: 0.25,
      animation: {
        type: "sunburst",
        speed: 2,
        intensity: 4,
      },
    },
    [`flags.world.${flag}`]: {
      enabled: true,
      backup: {
        dim: currentLight.dim,
        color: currentLight.color,
        alpha: currentLight.alpha,
        animation: {
          type: currentLight.animation.type,
          speed: currentLight.animation.speed,
          intensity: currentLight.animation.intensity,
        },
      }
    }
  };

  await token.update(data);

}

