import { Apple, Mail } from "lucide-react";
import { Button } from "../ui/button";

interface LandingProps {
  onContinue: () => void;
}

export function Landing({ onContinue }: LandingProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 bg-[#222]">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-[#0F8] rounded-3xl flex items-center justify-center shadow-2xl">
            <span className="text-5xl">🛒</span>
          </div>
          <h1 className="text-white mb-2">Sidequest</h1>
          <p className="text-gray-400">Making grocery runs rewarding</p>
        </div>
      </div>
      
      <div className="w-full max-w-sm space-y-3 pb-12">
        <Button 
          onClick={onContinue}
          className="w-full bg-black text-white hover:bg-gray-900 h-12 rounded-xl border border-white/10"
        >
          <Apple className="mr-2 h-5 w-5" />
          Sign in with Apple
        </Button>
        <Button 
          onClick={onContinue}
          variant="outline"
          className="w-full bg-[#333] text-white border-white/20 hover:bg-[#444] h-12 rounded-xl"
        >
          <Mail className="mr-2 h-5 w-5" />
          Sign in with Email
        </Button>
      </div>
    </div>
  );
}
