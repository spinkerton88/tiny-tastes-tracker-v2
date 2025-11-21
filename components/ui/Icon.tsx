import React, { useRef, useEffect } from 'react';

declare global {
  interface Window {
    lucide: {
      createIcons: () => void;
    };
  }
}

interface IconProps {
  name: string;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, className = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Create the placeholder `<i>` tag as a string with the necessary attributes.
      // Lucide will find this element by its `data-lucide` attribute.
      const iconPlaceholder = `<i data-lucide="${name}" class="${className}"></i>`;
      
      // We set the innerHTML of our container span.
      ref.current.innerHTML = iconPlaceholder;
      
      // We then call `createIcons()` which will replace the `<i>` tag with an `<svg>`.
      // Since React only manages the `<span>`, it doesn't crash when the content changes.
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
    // This effect runs whenever the icon name or its styling changes.
  }, [name, className]);

  // The container `<span>` holds the icon. We apply the className here as well
  // so that layout and color styles are applied immediately, preventing flicker.
  // The generated SVG will also receive these classes from the placeholder `<i>`.
  return <span ref={ref} className={className} />;
};

export default Icon;
