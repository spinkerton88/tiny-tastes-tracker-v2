
import React, { useState } from 'react';
import Icon from './Icon';

interface AccordionProps {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, icon, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`accordion-item bg-white shadow-sm rounded-lg border border-gray-200 ${isOpen ? 'is-open' : ''}`}>
      <button
        className="accordion-toggle flex justify-between items-center w-full p-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-3">
          <Icon name={icon} className="w-5 h-5 text-teal-600" />
          <span className="text-md font-medium text-gray-700">{title}</span>
        </span>
        <Icon name="chevron-down" className={`w-5 h-5 text-gray-400 accordion-arrow transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className="accordion-content">
        <div className="p-4 pt-0 text-gray-600 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
