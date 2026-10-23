import { type ReactNode } from "react";

interface Props {
  /** Change this value to trigger a re-animation (e.g. page number, filter) */
  watchKey: string | number;
  children: ReactNode;
  className?: string;
}

/**
 * Re-animates children with a fade+slide-up whenever watchKey changes.
 * Usage: <FadeContainer watchKey={page}><Table /></FadeContainer>
 */
export default function FadeContainer({ watchKey, children, className = "" }: Props) {
  return (
    <div key={watchKey} className={`data-container ${className}`}>
      {children}
    </div>
  );
}
