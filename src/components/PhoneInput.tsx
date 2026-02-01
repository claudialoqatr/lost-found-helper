import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CountryCode {
  code: string;
  dial: string;
  name: string;
}

const countryCodes: CountryCode[] = [
  { code: "ZA", dial: "+27", name: "South Africa" },
  { code: "US", dial: "+1", name: "United States" },
  { code: "GB", dial: "+44", name: "United Kingdom" },
  { code: "AU", dial: "+61", name: "Australia" },
  { code: "DE", dial: "+49", name: "Germany" },
  { code: "FR", dial: "+33", name: "France" },
  { code: "IN", dial: "+91", name: "India" },
  { code: "BR", dial: "+55", name: "Brazil" },
  { code: "CA", dial: "+1", name: "Canada" },
  { code: "MX", dial: "+52", name: "Mexico" },
  { code: "NG", dial: "+234", name: "Nigeria" },
  { code: "KE", dial: "+254", name: "Kenya" },
  { code: "EG", dial: "+20", name: "Egypt" },
  { code: "AE", dial: "+971", name: "UAE" },
  { code: "SG", dial: "+65", name: "Singapore" },
  { code: "NZ", dial: "+64", name: "New Zealand" },
  { code: "IE", dial: "+353", name: "Ireland" },
  { code: "NL", dial: "+31", name: "Netherlands" },
  { code: "BE", dial: "+32", name: "Belgium" },
  { code: "CH", dial: "+41", name: "Switzerland" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PhoneInput({ value, onChange, placeholder = "Phone number" }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState("ZA"); // Default to South Africa
  const [phoneNumber, setPhoneNumber] = useState("");

  const getDialCode = (countryCode: string) => {
    return countryCodes.find(c => c.code === countryCode)?.dial || "+27";
  };

  // Try to detect country from browser/timezone on mount
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes("Johannesburg") || timezone.includes("Africa/")) {
        setSelectedCountry("ZA");
      } else if (timezone.includes("London") || timezone.includes("Europe/London")) {
        setSelectedCountry("GB");
      } else if (timezone.includes("America/New_York") || timezone.includes("America/Los_Angeles")) {
        setSelectedCountry("US");
      } else if (timezone.includes("Sydney") || timezone.includes("Australia/")) {
        setSelectedCountry("AU");
      }
    } catch {
      // Fallback to South Africa
      setSelectedCountry("ZA");
    }
  }, []);

  // Parse incoming value on mount
  useEffect(() => {
    if (value && value.startsWith("+")) {
      // Find matching country code
      const matchedCountry = countryCodes.find(c => value.startsWith(c.dial));
      if (matchedCountry) {
        setSelectedCountry(matchedCountry.code);
        setPhoneNumber(value.slice(matchedCountry.dial.length));
      }
    }
  }, []);

  // Memoize the onChange to prevent infinite loops
  const updateValue = useCallback((country: string, phone: string) => {
    const dialCode = getDialCode(country);
    const cleanNumber = phone.replace(/\D/g, "");
    if (cleanNumber) {
      onChange(`${dialCode}${cleanNumber}`);
    } else {
      onChange("");
    }
  }, [onChange]);

  // Update parent value when country or phone number changes
  useEffect(() => {
    updateValue(selectedCountry, phoneNumber);
  }, [selectedCountry, phoneNumber, updateValue]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const cleaned = e.target.value.replace(/\D/g, "");
    setPhoneNumber(cleaned);
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
  };

  return (
    <div className="flex gap-2">
      <Select value={selectedCountry} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[100px] flex-shrink-0">
          <SelectValue>
            {getDialCode(selectedCountry)} {selectedCountry}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.dial} {country.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        placeholder={placeholder}
        value={phoneNumber}
        onChange={handlePhoneChange}
        className="flex-1"
      />
    </div>
  );
}
