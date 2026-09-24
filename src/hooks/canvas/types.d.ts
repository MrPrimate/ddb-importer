export {};

declare global {
  interface IImagePreview {
    style: Pick<
      IRegionDisplayProfile,
      | "pattern"
      | "textureSrc"
      | "textureColorMode"
      | "textureAnchor"
      | "textureFit"
      | "spacing"
      | "thickness"
      | "offset"
      | "gapOpacity"
      | "border"
      | "borderWidth"
    >;
    color: string;
    grid: number;
  }
}
