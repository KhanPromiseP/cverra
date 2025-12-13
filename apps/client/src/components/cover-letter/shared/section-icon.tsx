// client/components/cover-letter/shared/section-icon.tsx
import { Tooltip } from "@reactive-resume/ui";
import { ReactNode } from "react";

type SectionIconProps = {
  id: string;
  name?: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "outline";
};

export const SectionIcon = ({
  id,
  name,
  icon,
  onClick,
  variant = "default",
}: SectionIconProps) => {
  if (!name) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center justify-center rounded p-2 transition-colors cursor-pointer
          ${
            variant === "default"
              ? "bg-secondary hover:bg-secondary-accent"
              : "border border-dashed border-secondary-accent hover:bg-secondary-accent"
          }
        `}
      >
        {icon}
      </div>
    );
  }

  return (
    <Tooltip content={name}>
      <div
        onClick={onClick}
        className={`flex items-center justify-center rounded p-2 transition-colors cursor-pointer
          ${
            variant === "default"
              ? "bg-secondary hover:bg-secondary-accent"
              : "border border-dashed border-secondary-accent hover:bg-secondary-accent"
          }
        `}
      >
        {icon}
      </div>
    </Tooltip>
  );
};