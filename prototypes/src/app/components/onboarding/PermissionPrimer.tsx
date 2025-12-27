import { MapPin, Camera } from "lucide-react";
import { Button } from "../ui/button";

interface PermissionPrimerProps {
  onContinue: () => void;
}

export function PermissionPrimer({ onContinue }: PermissionPrimerProps) {
  return (
    <div className="h-full flex flex-col bg-[#222]">
      <div className="px-6 pt-16 pb-8">
        <h1 className="mb-2 text-white">We Need Your Help</h1>
        <p className="text-gray-400">To make shopping effortless, we need a couple permissions</p>
      </div>
      
      <div className="flex-1 px-6 space-y-6 overflow-auto">
        <div className="bg-[#2a2a2a] rounded-2xl p-6 border border-[#333]">
          <div className="w-16 h-16 bg-[#0F8]/20 rounded-2xl flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-[#0F8]" />
          </div>
          <h3 className="mb-2 text-white">Location Access</h3>
          <p className="text-gray-400 text-sm">
            We'll notify you when you're near a store with active bounties. Your location is never shared with roommates.
          </p>
        </div>

        <div className="bg-[#2a2a2a] rounded-2xl p-6 border border-[#333]">
          <div className="w-16 h-16 bg-[#0F8]/20 rounded-2xl flex items-center justify-center mb-4">
            <Camera className="h-8 w-8 text-[#0F8]" />
          </div>
          <h3 className="mb-2 text-white">Camera Access</h3>
          <p className="text-gray-400 text-sm">
            Snap a photo of your receipt and we'll automatically split the items. No manual entry needed.
          </p>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
          <p className="text-sm text-yellow-200/80">
            <strong>Privacy Note:</strong> Sidequest is not meant for collecting PII or securing sensitive data. Only use with trusted roommates.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-3">
        <Button 
          onClick={onContinue}
          className="w-full h-14 rounded-xl bg-[#0F8] hover:bg-[#0F8]/90 text-black"
        >
          Enable Permissions
        </Button>
        <Button 
          onClick={onContinue}
          variant="ghost"
          className="w-full text-gray-400 hover:text-white"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}
