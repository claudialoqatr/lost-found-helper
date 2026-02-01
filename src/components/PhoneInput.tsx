import { useState, useRef } from "react";
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

const getDialCode = (countryCode: string) => {
  return countryCodes.find(c => c.code === countryCode)?.dial || "+27";
};

const detectCountryFromTimezone = (): string => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes("Johannesburg") || timezone.includes("Africa/")) {
      return "ZA";
    } else if (timezone.includes("London") || timezone.includes("Europe/London")) {
      return "GB";
    } else if (timezone.includes("America/New_York") || timezone.includes("America/Los_Angeles")) {
      return "US";
    } else if (timezone.includes("Sydney") || timezone.includes("Australia/")) {
      return "AU";
    }
  } catch {
    // Fallback
  }
  return "ZA";
};

const parseInitialValue = (value: string): { country: string; phone: string } => {
  if (value && value.startsWith("+")) {
    const matchedCountry = countryCodes.find(c => value.startsWith(c.dial));
    if (matchedCountry) {
      return {
        country: matchedCountry.code,
        phone: value.slice(matchedCountry.dial.length),
      };
    }
  }
  return { country: detectCountryFromTimezone(), phone: "" };
};

export function PhoneInput({ value, onChange, placeholder = "Phone number" }: PhoneInputProps) {
  const initialized = useRef(false);
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const parsed = parseInitialValue(value);
    return parsed.country;
  });
  const [phoneNumber, setPhoneNumber] = useState(() => {
    const parsed = parseInitialValue(value);
    return parsed.phone;
  });

  // Only initialize once
  if (!initialized.current) {
    initialized.current = true;
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "");
    setPhoneNumber(cleaned);
    
    const dialCode = getDialCode(selectedCountry);
    if (cleaned) {
      onChange(`${dialCode}${cleaned}`);
    } else {
      onChange("");
    }
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    
    const dialCode = getDialCode(countryCode);
    if (phoneNumber) {
      onChange(`${dialCode}${phoneNumber}`);
    }
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
