import { useState, useEffect } from "react";
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
  const [countryCode, setCountryCode] = useState("+27"); // Default to South Africa
  const [phoneNumber, setPhoneNumber] = useState("");

  // Try to detect country from browser/timezone on mount
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const country = countryCodes.find(c => {
        // Simple timezone-based detection
        if (timezone.includes("Johannesburg") || timezone.includes("Africa/")) {
          return c.code === "ZA";
        }
        if (timezone.includes("London") || timezone.includes("Europe/London")) {
          return c.code === "GB";
        }
        if (timezone.includes("America/New_York") || timezone.includes("America/Los_Angeles")) {
          return c.code === "US";
        }
        if (timezone.includes("Sydney") || timezone.includes("Australia/")) {
          return c.code === "AU";
        }
        return false;
      });
      if (country) {
        setCountryCode(country.dial);
      }
    } catch {
      // Fallback to South Africa
      setCountryCode("+27");
    }
  }, []);

  // Parse incoming value on mount
  useEffect(() => {
    if (value && value.startsWith("+")) {
      // Find matching country code
      const matchedCountry = countryCodes.find(c => value.startsWith(c.dial));
      if (matchedCountry) {
        setCountryCode(matchedCountry.dial);
        setPhoneNumber(value.slice(matchedCountry.dial.length));
      }
    }
  }, []);

  // Update parent value when country code or phone number changes
  useEffect(() => {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    if (cleanNumber) {
      onChange(`${countryCode}${cleanNumber}`);
    } else {
      onChange("");
    }
  }, [countryCode, phoneNumber, onChange]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const cleaned = e.target.value.replace(/\D/g, "");
    setPhoneNumber(cleaned);
  };

  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={setCountryCode}>
        <SelectTrigger className="w-[100px] flex-shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((country) => (
            <SelectItem key={`${country.code}-${country.dial}`} value={country.dial}>
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
