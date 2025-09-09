import { cn, isUrl } from "@reactive-resume/utils";
import { useArtboardStore } from "../store/artboard";

type PictureProps = {
  className?: string;
  size?: number; // Add size prop to control the dimensions
};

export const Picture = ({ className, size }: PictureProps) => {
  const picture = useArtboardStore((state) => state.resume.basics.picture);
  const fontSize = useArtboardStore((state) => state.resume.metadata.typography.font.size);

  if (!isUrl(picture.url) || picture.effects.hidden) return null;

  // Use the provided size prop or fall back to the stored size
  const imageSize = size || picture.size;

  return (
    <div className="flex justify-center">
      <img
        src={picture.url}
        alt="Profile"
        className={cn(
          "relative z-20 object-cover rounded-full", // Added rounded-full for perfect circle
          picture.effects.border && "border-primary",
          picture.effects.grayscale && "grayscale",
          className,
        )}
        style={{
          width: `${imageSize}px`,
          height: `${imageSize}px`, // Set both width and height to the same value
          borderWidth: `${picture.effects.border ? fontSize / 3 : 0}px`,
        }}
      />
    </div>
  );
};