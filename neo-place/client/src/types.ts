export type PixelPosition = [number, number];

export type PixelColor =
  | "#000000"
  | "#FFFFFF"
  | "#CC254B"
  | "#018BFF"
  | "#327D60"
  | "#FFDE63";

export type Pixel = {
  position: PixelPosition;
  color: PixelColor;
};

export type PixelClickedCallback = (position: PixelPosition) => void;

export type PixelUpdate = { updatedPixel: Pixel };
