import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, MapPin } from 'lucide-react';

// Common countries for dropdown
const countries = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
  'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland',
  'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland',
  'Portugal', 'Poland', 'Czech Republic', 'Greece', 'Turkey', 'Russia',
  'Japan', 'South Korea', 'China', 'India', 'Singapore', 'Malaysia',
  'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Hong Kong', 'Taiwan',
  'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru',
  'South Africa', 'Nigeria', 'Kenya', 'Egypt', 'UAE', 'Saudi Arabia',
  'Israel', 'New Zealand', 'Pakistan', 'Bangladesh'
].sort();

// US States
const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
];

const AddressInput = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false,
  fontClass = ''
}) => {
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const countryRef = useRef(null);
  const stateRef = useRef(null);

  // Parse address value
  const parseAddress = (val) => {
    if (!val || typeof val !== 'object') {
      return {
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States'
      };
    }
    return {
      street1: val.street1 || '',
      street2: val.street2 || '',
      city: val.city || '',
      state: val.state || '',
      zip: val.zip || '',
      country: val.country || 'United States'
    };
  };

  const address = parseAddress(value);

  const updateField = (field, newValue) => {
    onChange({ ...address, [field]: newValue });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setShowCountryDropdown(false);
      }
      if (stateRef.current && !stateRef.current.contains(e.target)) {
        setShowStateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = countries.filter(c => 
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredStates = usStates.filter(s => 
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const isUS = address.country === 'United States';

  const inputClass = `w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm placeholder:text-gray-400 ${fontClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <div className="space-y-3">
      {/* Header with icon */}
      <div className="flex items-center gap-2 text-gray-500">
        <MapPin className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">Address</span>
      </div>

      {/* Street Address 1 */}
      <input
        type="text"
        value={address.street1}
        onChange={(e) => updateField('street1', e.target.value)}
        placeholder="Street address"
        disabled={disabled}
        className={inputClass}
      />

      {/* Street Address 2 */}
      <input
        type="text"
        value={address.street2}
        onChange={(e) => updateField('street2', e.target.value)}
        placeholder="Apartment, suite, unit, etc. (optional)"
        disabled={disabled}
        className={inputClass}
      />

      {/* City and State/Zip Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* City */}
        <input
          type="text"
          value={address.city}
          onChange={(e) => updateField('city', e.target.value)}
          placeholder="City"
          disabled={disabled}
          className={inputClass}
        />

        {/* State/Province */}
        {isUS ? (
          <div className="relative" ref={stateRef}>
            <button
              type="button"
              onClick={() => !disabled && setShowStateDropdown(!showStateDropdown)}
              disabled={disabled}
              className={`${inputClass} flex items-center justify-between text-left`}
            >
              <span className={address.state ? 'text-gray-900' : 'text-gray-400'}>
                {address.state || 'State'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            
            {showStateDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-48 overflow-hidden rounded-lg bg-white shadow-xl border border-gray-200">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-6 pr-2 py-1 text-xs rounded border border-gray-200 focus:outline-none focus:border-primary-500"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {filteredStates.map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => {
                        updateField('state', state);
                        setShowStateDropdown(false);
                        setStateSearch('');
                      }}
                      className="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 transition-colors"
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={address.state}
            onChange={(e) => updateField('state', e.target.value)}
            placeholder="State / Province / Region"
            disabled={disabled}
            className={inputClass}
          />
        )}
      </div>

      {/* Zip and Country Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Zip/Postal Code */}
        <input
          type="text"
          value={address.zip}
          onChange={(e) => updateField('zip', e.target.value)}
          placeholder={isUS ? 'ZIP code' : 'Postal code'}
          disabled={disabled}
          className={inputClass}
        />

        {/* Country */}
        <div className="relative" ref={countryRef}>
          <button
            type="button"
            onClick={() => !disabled && setShowCountryDropdown(!showCountryDropdown)}
            disabled={disabled}
            className={`${inputClass} flex items-center justify-between text-left`}
          >
            <span className={address.country ? 'text-gray-900' : 'text-gray-400'}>
              {address.country || 'Country'}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          
          {showCountryDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-48 overflow-hidden rounded-lg bg-white shadow-xl border border-gray-200">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-6 pr-2 py-1 text-xs rounded border border-gray-200 focus:outline-none focus:border-primary-500"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-36 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => {
                      updateField('country', country);
                      setShowCountryDropdown(false);
                      setCountrySearch('');
                    }}
                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 transition-colors"
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default AddressInput;
