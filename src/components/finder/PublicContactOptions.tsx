import { Phone, Mail, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface OwnerContact {
  owner_name: string;
  owner_email: string;
  owner_phone: string | null;
  whatsapp_url: string | null;
}

interface PublicContactOptionsProps {
  contact: OwnerContact;
  itemName: string;
  locationAddress: string | null;
}

export function PublicContactOptions({ 
  contact, 
  itemName, 
  locationAddress 
}: PublicContactOptionsProps) {
  const displayName = contact.owner_name.split(" ")[0];

  const getPhoneLink = () => {
    if (!contact.owner_phone) return null;
    return `tel:${contact.owner_phone}`;
  };

  const getWhatsAppLink = () => {
    if (!contact.owner_phone) return null;
    const cleanPhone = contact.owner_phone.replace(/\D/g, "");
    
    // Build location text: prefer address, fallback to Google Maps link
    let locationText = "";
    if (locationAddress) {
      locationText = `\n\n📍 Location: ${locationAddress}`;
    }
    
    const message = encodeURIComponent(
      `Hi ${displayName} 👋🏼\n\nI found your ${itemName} using your *LOQATR* tag! 👀\n\nHow can I help? 🥳${locationText}\n\n_Get yours! www.loqatr.com_`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const getEmailLink = () => {
    if (!contact.owner_email) return null;
    const locationText = locationAddress ? `\n\nFound at: ${locationAddress}` : "";
    const subject = encodeURIComponent(`Found: ${itemName}`);
    const body = encodeURIComponent(
      `Hi ${displayName},\n\nI found your ${itemName} tagged with Loqatr.${locationText}\n\nPlease let me know how I can return it to you.`
    );
    return `mailto:${contact.owner_email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-xl text-center">Contact {displayName}</h2>
      <p className="text-center text-muted-foreground text-sm mb-6">
        Choose how you'd like to reach out to the owner
      </p>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {contact.owner_phone && (
          <Card
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary"
            onClick={() => window.open(getPhoneLink()!, "_blank")}
          >
            <CardContent className="p-3 md:pt-6 md:pb-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2 md:mb-4">
                <Phone className="h-5 w-5 md:h-8 md:w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1">Call</h3>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Speak directly with {displayName}
              </p>
            </CardContent>
          </Card>
        )}

        {contact.owner_phone && (
          <Card
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary"
            onClick={() => window.open(getWhatsAppLink()!, "_blank")}
          >
            <CardContent className="p-3 md:pt-6 md:pb-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 md:mb-4">
                <MessageCircle className="h-5 w-5 md:h-8 md:w-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1">WhatsApp</h3>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Send a quick message
              </p>
            </CardContent>
          </Card>
        )}

        {contact.owner_email && (
          <Card
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary"
            onClick={() => window.open(getEmailLink()!, "_blank")}
          >
            <CardContent className="p-3 md:pt-6 md:pb-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 md:mb-4">
                <Mail className="h-5 w-5 md:h-8 md:w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1">Email</h3>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Send a detailed message
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
