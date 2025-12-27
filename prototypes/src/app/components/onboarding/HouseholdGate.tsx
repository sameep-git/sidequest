import { useState } from "react";
import { Home, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface HouseholdGateProps {
  onContinue: (houseName: string) => void;
}

export function HouseholdGate({ onContinue }: HouseholdGateProps) {
  const [mode, setMode] = useState<"choose" | "join" | "create">("choose");
  const [houseCode, setHouseCode] = useState("");
  const [houseName, setHouseName] = useState("");

  const handleJoin = () => {
    if (houseCode.length === 6) {
      onContinue("The Trap House");
    }
  };

  const handleCreate = () => {
    if (houseName.trim()) {
      onContinue(houseName);
    }
  };

  if (mode === "choose") {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 bg-[#222]">
        <div className="text-center mb-12">
          <h1 className="mb-2 text-white">Find Your Household</h1>
          <p className="text-gray-400">Join or create a house to get started</p>
        </div>
        
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => setMode("join")}
            className="w-full p-8 bg-[#2a2a2a] rounded-2xl border-2 border-[#333] hover:border-[#0F8] hover:shadow-lg hover:shadow-[#0F8]/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="w-12 h-12 bg-[#0F8]/20 rounded-xl flex items-center justify-center mb-3">
                  <Home className="h-6 w-6 text-[#0F8]" />
                </div>
                <h3 className="mb-1 text-white">Join Existing House</h3>
                <p className="text-gray-400 text-sm">Enter a 6-digit code</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode("create")}
            className="w-full p-8 bg-[#2a2a2a] rounded-2xl border-2 border-[#333] hover:border-[#0F8] hover:shadow-lg hover:shadow-[#0F8]/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="w-12 h-12 bg-[#0F8]/20 rounded-xl flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-[#0F8]" />
                </div>
                <h3 className="mb-1 text-white">Create New House</h3>
                <p className="text-gray-400 text-sm">Start fresh with roommates</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="h-full flex flex-col bg-[#222]">
        <div className="px-6 pt-16 pb-8">
          <button onClick={() => setMode("choose")} className="text-[#0F8] mb-6">
            ← Back
          </button>
          <h1 className="mb-2 text-white">Join House</h1>
          <p className="text-gray-400">Enter the 6-digit code from your roommate</p>
        </div>
        
        <div className="flex-1 px-6">
          <Input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={houseCode}
            onChange={(e) => setHouseCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-widest h-16 rounded-xl bg-[#2a2a2a] border-[#333] text-white"
          />
        </div>

        <div className="p-6">
          <Button 
            onClick={handleJoin}
            disabled={houseCode.length !== 6}
            className="w-full h-14 rounded-xl bg-[#0F8] hover:bg-[#0F8]/90 text-black"
          >
            Join House
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#222]">
      <div className="px-6 pt-16 pb-8">
        <button onClick={() => setMode("choose")} className="text-[#0F8] mb-6">
          ← Back
        </button>
        <h1 className="mb-2 text-white">Create House</h1>
        <p className="text-gray-400">Give your household a name</p>
      </div>
      
      <div className="flex-1 px-6">
        <Input
          type="text"
          placeholder="e.g., The Trap House"
          value={houseName}
          onChange={(e) => setHouseName(e.target.value)}
          className="h-14 rounded-xl bg-[#2a2a2a] border-[#333] text-white"
        />
      </div>

      <div className="p-6">
        <Button 
          onClick={handleCreate}
          disabled={!houseName.trim()}
          className="w-full h-14 rounded-xl bg-[#0F8] hover:bg-[#0F8]/90 text-black"
        >
          Create House
        </Button>
      </div>
    </div>
  );
}
