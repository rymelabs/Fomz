import React, { useState } from 'react';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import { ChevronDown } from 'lucide-react';

const fontOptions = [
  { value: 'poppins', label: 'Poppins', family: 'Poppins, sans-serif' },
  { value: 'inter', label: 'Inter', family: 'Inter, sans-serif' },
  { value: 'roboto', label: 'Roboto', family: 'Roboto, sans-serif' },
  { value: 'lato', label: 'Lato', family: 'Lato, sans-serif' },
  { value: 'opensans', label: 'Open Sans', family: 'Open Sans, sans-serif' },
  { value: 'montserrat', label: 'Montserrat', family: 'Montserrat, sans-serif' },
  { value: 'raleway', label: 'Raleway', family: 'Raleway, sans-serif' },
  { value: 'sourcesans', label: 'Source Sans', family: 'Source Sans 3, sans-serif' },
  { value: 'playfair', label: 'Playfair', family: 'Playfair Display, serif' },
  { value: 'serif', label: 'Serif', family: 'Inria Serif, Georgia, serif' },
  { value: 'mono', label: 'Mono', family: 'ui-monospace, monospace' },
  { value: 'dancing', label: 'Dancing Script', family: 'Dancing Script, cursive' },
  { value: 'pacifico', label: 'Pacifico', family: 'Pacifico, cursive' },
];

const sizeOptions = [
  { value: 'sm', label: 'Compact' },
  { value: 'md', label: 'Standard' },
  { value: 'lg', label: 'Large' },
];

const radiusOptions = [
  { value: 'none', label: 'Square' },
  { value: 'md', label: 'Rounded' },
  { value: 'lg', label: 'Soft' },
  { value: 'full', label: 'Pill' },
];

const SettingsGroup = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mb-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</span>
        <ChevronDown 
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="p-3 bg-white border-t border-gray-200 space-y-4">
            {children}
        </div>
      )}
    </div>
  );
};

const StyleSettings = () => {
  const { style, updateStyle } = useFormBuilderStore((state) => ({
    style: state.style,
    updateStyle: state.updateStyle
  }));
  const [showAllFonts, setShowAllFonts] = useState(false);

  const visibleFonts = showAllFonts ? fontOptions : fontOptions.slice(0, 3);

  return (
    <div className="space-y-1">
      <SettingsGroup title="Typography" defaultOpen={true}>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Font Family</label>
          <div className="grid grid-cols-3 gap-1.5">
            {visibleFonts.map((option) => (
              <button
                key={option.value}
                onClick={() => updateStyle({ fontFamily: option.value })}
                style={{ fontFamily: option.family }}
                className={`px-2 py-1.5 text-xs border rounded-lg transition-all ${
                  style.fontFamily === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAllFonts(!showAllFonts)}
            className="mt-2 text-[10px] text-primary-600 hover:text-primary-700 font-medium"
          >
            {showAllFonts ? '← See less' : 'See more fonts →'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Text Size</label>
          <div className="grid grid-cols-3 gap-2">
            {sizeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateStyle({ fontSize: option.value })}
                className={`px-3 py-2 text-xs border rounded-lg transition-all ${
                  style.fontSize === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Component Style">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Corner Radius</label>
          <div className="grid grid-cols-4 gap-2">
            {radiusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateStyle({ borderRadius: option.value })}
                className={`px-2 py-2 text-xs border rounded-lg transition-all ${
                  style.borderRadius === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </SettingsGroup>
    </div>
  );
};


export default StyleSettings;
