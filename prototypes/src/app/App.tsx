import { useState } from "react";
import { Home, List, Camera, User } from "lucide-react";
import { Landing } from "./components/onboarding/Landing";
import { HouseholdGate } from "./components/onboarding/HouseholdGate";
import { PermissionPrimer } from "./components/onboarding/PermissionPrimer";
import { HomeTab } from "./components/tabs/HomeTab";
import { ShopTab } from "./components/tabs/ShopTab";
import { ScanTab } from "./components/tabs/ScanTab";
import { ProfileTab } from "./components/tabs/ProfileTab";

type AppState = "landing" | "household" | "permissions" | "main";
type TabState = "home" | "shop" | "scan" | "profile";

export default function App() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [activeTab, setActiveTab] = useState<TabState>("home");
  const [houseName, setHouseName] = useState("The Trap House");

  // Onboarding Flow
  if (appState === "landing") {
    return (
      <div className="h-full flex items-center justify-center bg-[#111]">
        <div className="w-full h-full max-w-md bg-[#222] shadow-2xl overflow-hidden">
          <Landing onContinue={() => setAppState("household")} />
        </div>
      </div>
    );
  }

  if (appState === "household") {
    return (
      <div className="h-full flex items-center justify-center bg-[#111]">
        <div className="w-full h-full max-w-md bg-[#222] shadow-2xl overflow-hidden">
          <HouseholdGate 
            onContinue={(name) => {
              setHouseName(name);
              setAppState("permissions");
            }} 
          />
        </div>
      </div>
    );
  }

  if (appState === "permissions") {
    return (
      <div className="h-full flex items-center justify-center bg-[#111]">
        <div className="w-full h-full max-w-md bg-[#222] shadow-2xl overflow-hidden">
          <PermissionPrimer onContinue={() => setAppState("main")} />
        </div>
      </div>
    );
  }

  // Main App with Tab Navigation
  return (
    <div className="h-full flex items-center justify-center bg-[#111]">
      {/* Mobile Frame */}
      <div className="w-full h-full max-w-md bg-[#222] shadow-2xl overflow-hidden relative flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "home" && <HomeTab houseName={houseName} />}
          {activeTab === "shop" && <ShopTab />}
          {activeTab === "scan" && <ScanTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>

        {/* iOS-style Bottom Tab Bar */}
        <div className="bg-[#1a1a1a] border-t border-[#333]">
          <div className="flex items-center justify-around px-4 py-2">
            <TabButton
              icon={<Home className="h-6 w-6" />}
              label="Home"
              active={activeTab === "home"}
              onClick={() => setActiveTab("home")}
            />
            <TabButton
              icon={<List className="h-6 w-6" />}
              label="Shop"
              active={activeTab === "shop"}
              onClick={() => setActiveTab("shop")}
            />
            <TabButton
              icon={<Camera className="h-6 w-6" />}
              label="Scan"
              active={activeTab === "scan"}
              onClick={() => setActiveTab("scan")}
            />
            <TabButton
              icon={<User className="h-6 w-6" />}
              label="Profile"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ icon, label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-2 px-4 min-w-[60px] transition-colors ${
        active ? "text-[#0F8]" : "text-gray-500"
      }`}
    >
      <div className={active ? "scale-110 transition-transform" : ""}>
        {icon}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}