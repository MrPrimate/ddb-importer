// Pure predicate used by AdventureMunch to identify imported scenes that
// probably shipped without grid alignment. Lives in its own file so unit tests
// can import it without pulling AdventureMunch's full dependency graph.
export async function isGridDetectionCandidate(
  scene: any,
  getDimensions: (src: string) => Promise<{ width: number; height: number }>,
): Promise<boolean> {
  // a live V14 scene holds its levels in a collection, scene data in an array
  const firstLevel = scene?.levels?.contents?.[0] ?? scene?.levels?.[0];
  const src = firstLevel?.background?.src ?? scene?.background?.src ?? null;
  if (!src) return false;

  const shiftX = Number(scene.shiftX ?? 0);
  const shiftY = Number(scene.shiftY ?? 0);
  if (shiftX !== 0 || shiftY !== 0) return false;

  const sceneWidth = Number(scene.width);
  const sceneHeight = Number(scene.height);
  if (!Number.isFinite(sceneWidth) || !Number.isFinite(sceneHeight)) return false;

  try {
    const dims = await getDimensions(src);
    if (Math.abs(dims.width - sceneWidth) > 1) return false;
    if (Math.abs(dims.height - sceneHeight) > 1) return false;
    return true;
  } catch {
    return false;
  }
}
