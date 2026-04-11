import { logger, utils, FileHelper } from "./_module";

export interface SceneSnipRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SceneSnipConfig {
  id: string;
  name: string;
  sourceLevelId: string;
  targetLevelIds: string[];
  region: SceneSnipRegion;
  tileImagePath: string;
  coverTile: boolean;
  coverColor: string;
  createdTileIds: string[];
  tilePlacement?: SceneSnipRegion;
  coverTilePlacement?: SceneSnipRegion;
}

/**
 * Normalise a snip loaded from flags: migrates legacy `targetLevelId` (string)
 * to `targetLevelIds` (string[]).
 */
function migrateSnipConfig(raw: any): SceneSnipConfig {
  if (raw.targetLevelIds) return raw as SceneSnipConfig;
  return {
    ...raw,
    targetLevelIds: raw.targetLevelId ? [raw.targetLevelId] : [],
  };
}

/**
 * Slim version of SceneSnipProcessor retained in ddb-importer for adventure
 * import/export. The full interactive UI lives in the standalone snipsnipsnip module.
 */
export default class SceneSnipProcessor {

  static getSnips(scene: any): SceneSnipConfig[] {
    // Prefer new namespace, fall back to legacy ddbimporter flags
    let raw = scene.getFlag?.("snipsnipsnip", "snips");
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      raw = (scene.flags?.ddbimporter as any)?.snips;
    }
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map(migrateSnipConfig);
  }

  static async setSnips(scene: any, snips: SceneSnipConfig[]): Promise<void> {
    await scene.setFlag("snipsnipsnip", "snips", snips);
    // Clear legacy ddbimporter flags once migrated to the new namespace
    if (scene.flags?.ddbimporter?.snips) {
      await scene.update({ [`flags.-=ddbimporter`]: null });
    }
  }

  static getUploadPath(): string {
    const basePath = utils.getSetting<string>("adventure-upload-path");
    return `${basePath}/snips`;
  }

  static async ensureUploadDir(): Promise<void> {
    const path = SceneSnipProcessor.getUploadPath();
    const parsedDir = FileHelper.parseDirectory(path);
    await FileHelper.verifyPath(parsedDir);
  }

  /**
   * Extract a rectangular region from the background texture as a lossless PNG blob.
   * Reads raw pixels from the GPU framebuffer and writes them to a 2D canvas with
   * imageSmoothingEnabled=false, bypassing all PIXI texture filtering.
   */
  static async extractRegionAsBlob(
    backgroundSrc: string,
    region: SceneSnipRegion,
  ): Promise<Blob> {
    const texture = await foundry.canvas.loadTexture(backgroundSrc) as PIXI.Texture;
    if (!texture?.valid) {
      throw new Error(`Failed to load texture: ${backgroundSrc}`);
    }

    // Convert canvas-space region to texture-space pixel coordinates
    const dim = (canvas as any).dimensions;
    const sceneRect = dim.sceneRect as PIXI.Rectangle;
    const scaleX = texture.width / sceneRect.width;
    const scaleY = texture.height / sceneRect.height;

    const tx = Math.round((region.x - sceneRect.x) * scaleX);
    const ty = Math.round((region.y - sceneRect.y) * scaleY);
    const tw = Math.round(region.width * scaleX);
    const th = Math.round(region.height * scaleY);

    // Clamp to texture bounds
    const x = Math.max(0, Math.min(tx, texture.width));
    const y = Math.max(0, Math.min(ty, texture.height));
    const width = Math.min(tw, texture.width - x);
    const height = Math.min(th, texture.height - y);

    if (width <= 0 || height <= 0) {
      throw new Error(`Snip region is outside the background image bounds`);
    }

    // Force NEAREST on the source to eliminate GPU texture filtering
    const origScaleMode = texture.baseTexture.scaleMode;
    texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    texture.baseTexture.update();

    // Crop via texture frame and render at 1:1
    const frame = new PIXI.Rectangle(x, y, width, height);
    const croppedTexture = new PIXI.Texture(texture.baseTexture, frame);
    const sprite = new PIXI.Sprite(croppedTexture);

    const renderTexture = PIXI.RenderTexture.create({
      width,
      height,
      scaleMode: PIXI.SCALE_MODES.NEAREST,
      resolution: 1,
    });
    canvas.app.renderer.render(sprite, { renderTexture });

    // Restore source scale mode
    texture.baseTexture.scaleMode = origScaleMode;
    texture.baseTexture.update();

    // Read raw pixels from the GPU and write to a 2D canvas with no smoothing
    const pixels = canvas.app.renderer.extract.pixels(renderTexture);
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = width;
    outputCanvas.height = height;
    const ctx = outputCanvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const imageData = new ImageData(new Uint8ClampedArray(pixels.buffer), width, height);
    ctx.putImageData(imageData, 0, 0);

    // Clean up PIXI resources
    croppedTexture.destroy(false);
    renderTexture.destroy(true);

    // Export as lossless PNG
    return new Promise<Blob>((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create PNG blob"))),
        "image/png",
      );
    });
  }

  /**
   * Create a solid-color PNG blob.
   */
  static createSolidColorBlob(color: string): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create solid color blob"));
      }, "image/png");
    });
  }

  /**
   * Get the background image source for a given level on a scene.
   */
  static getBackgroundSrc(scene: Scene, levelId: string): string | null {
    const level = (scene as any).levels.get(levelId);
    if (level?.background?.src) return level.background.src;
    // Fallback for scenes without proper levels
    const firstLevel = (scene as any).levels.contents[0];
    if (firstLevel?.background?.src) return firstLevel.background.src;
    return null;
  }

  /**
   * Reapply snips after a scene re-import (new background, same config).
   */
  static async reapplySnips(scene: Scene, snips: SceneSnipConfig[]): Promise<void> {
    await SceneSnipProcessor.ensureUploadDir();
    const uploadPath = SceneSnipProcessor.getUploadPath();
    const newSnips: SceneSnipConfig[] = [];

    for (const snip of snips) {
      try {
        const backgroundSrc = SceneSnipProcessor.getBackgroundSrc(scene, snip.sourceLevelId);
        if (!backgroundSrc) {
          logger.warn(`Skipping snip "${snip.name}": no background found for level ${snip.sourceLevelId}`);
          continue;
        }

        // Extract directly in canvas-space - the sprite is positioned to match the background
        const blob = await SceneSnipProcessor.extractRegionAsBlob(backgroundSrc, snip.region);
        const filename = `snip-${scene.id}-${snip.id}.png`;
        const imagePath = await FileHelper.uploadImage(blob, uploadPath, filename);

        // Use stored tile placement if available, otherwise derive from region
        const defaultX = Math.round(snip.region.x + snip.region.width / 2);
        const defaultY = Math.round(snip.region.y + snip.region.height / 2);
        const tileX = snip.tilePlacement ? Math.round(snip.tilePlacement.x) : defaultX;
        const tileY = snip.tilePlacement ? Math.round(snip.tilePlacement.y) : defaultY;

        const snipFlags = { "snipsnipsnip": { snipId: snip.id } };

        const tileData: any[] = [{
          name: `Snip: ${snip.name}`,
          texture: { src: imagePath },
          x: tileX,
          y: tileY,
          width: snip.region.width,
          height: snip.region.height,
          levels: snip.targetLevelIds,
          sort: 100,
          alpha: 1,
          flags: snipFlags,
        }];

        if (snip.coverTile) {
          const coverBlob = await SceneSnipProcessor.createSolidColorBlob(snip.coverColor);
          const coverFilename = `cover-${scene.id}-${snip.id}.png`;
          const coverPath = await FileHelper.uploadImage(coverBlob, uploadPath, coverFilename);
          const coverX = snip.coverTilePlacement ? Math.round(snip.coverTilePlacement.x) : tileX;
          const coverY = snip.coverTilePlacement ? Math.round(snip.coverTilePlacement.y) : tileY;
          tileData.push({
            name: `Snip: ${snip.name} (Cover)`,
            texture: { src: coverPath },
            x: coverX,
            y: coverY,
            width: snip.region.width,
            height: snip.region.height,
            levels: [snip.sourceLevelId],
            sort: 50,
            alpha: 1,
            flags: snipFlags,
          });
        }

        const createdTiles = await scene.createEmbeddedDocuments("Tile", tileData);

        // Match created tiles back by texture src (order not guaranteed)
        const imgTile = createdTiles.find((t: any) => t.texture?.src === imagePath);
        const covTile = snip.coverTile
          ? createdTiles.find((t: any) => t.texture?.src !== imagePath)
          : undefined;
        const tileIds = [
          imgTile?.id ?? createdTiles[0]?.id,
          ...(covTile ? [covTile.id] : []),
        ].filter(Boolean);

        newSnips.push({
          ...snip,
          tileImagePath: imagePath,
          createdTileIds: tileIds,
          tilePlacement: { x: tileX, y: tileY, width: snip.region.width, height: snip.region.height },
          ...(covTile ? { coverTilePlacement: { x: tileX, y: tileY, width: snip.region.width, height: snip.region.height } } : {}),
        });

        logger.info(`Reapplied snip "${snip.name}" on scene "${scene.name}"`);
      } catch (err) {
        logger.error(`Failed to reapply snip "${snip.name}"`, err);
      }
    }

    if (newSnips.length > 0) {
      await SceneSnipProcessor.setSnips(scene, newSnips);
    }
  }
}
