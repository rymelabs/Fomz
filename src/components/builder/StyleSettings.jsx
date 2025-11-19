import React from 'react';
import { useFormBuilderStore } from '../../store/formBuilderStore';

const fontOptions = [
  { value: 'sans', label: 'Modern (Sans)' },
  { value: 'serif', label: 'Elegant (Serif)' },
  { value: 'mono', label: 'Technical (Mono)' },
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

const StyleSettings = () => {
  const { style, updateStyle } = useFormBuilderStore((state) => ({
    style: state.style,
    updateStyle: state.updateStyle
  }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Font Family</label>
        <div className="grid grid-cols-3 gap-2">
          {fontOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateStyle({ fontFamily: option.value })}
              className={`px-3 py-2 text-xs border rounded-lg transition-all ${
                style.fontFamily === option.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
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
    </div>
  );
};

export default StyleSettings;
