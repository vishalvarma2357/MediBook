import { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  description?: string;
  rightContent?: ReactNode;
  className?: string;
}

export default function SectionHeading({
  title,
  description,
  rightContent,
  className,
}: SectionHeadingProps) {
  return (
    <div className={`flex justify-between items-center mb-6 ${className}`}>
      <div>
        <h2 className="text-xl font-bold text-neutral-800">{title}</h2>
        {description && <p className="text-neutral-600">{description}</p>}
      </div>
      {rightContent && <div>{rightContent}</div>}
    </div>
  );
}
