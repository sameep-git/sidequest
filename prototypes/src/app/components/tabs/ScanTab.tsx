import { useState } from "react";
import { Camera, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface ReceiptItem {
  id: number;
  name: string;
  price: number;
  assignedTo?: string;
  splitType?: "individual" | "split";
}

const mockRoommates = [
  { id: 1, name: "Sameep", initial: "S", color: "bg-[#0F8]" },
  { id: 2, name: "Alex", initial: "A", color: "bg-purple-500" },
  { id: 3, name: "Jordan", initial: "J", color: "bg-blue-500" },
];

export function ScanTab() {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "processing" | "itemizing" | "summary">("idle");
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([
    { id: 1, name: "Milk - Whole Gallon", price: 4.50 },
    { id: 2, name: "Eggs - 12ct", price: 3.20 },
    { id: 3, name: "Bread - Wheat Loaf", price: 2.80 },
    { id: 4, name: "Chicken Breast - 2lb", price: 12.40 },
    { id: 5, name: "Bananas - Organic", price: 3.60 },
    { id: 6, name: "Orange Juice - 64oz", price: 5.30 },
    { id: 7, name: "Cereal - Cheerios", price: 4.80 },
    { id: 8, name: "Butter - Salted", price: 3.90 },
  ]);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

  const totalAmount = receiptItems.reduce((sum, item) => sum + item.price, 0);
  const assignedAmount = receiptItems
    .filter(item => item.assignedTo)
    .reduce((sum, item) => sum + item.price, 0);

  const handleStartScan = () => {
    setScanState("scanning");
    setTimeout(() => {
      setScanState("processing");
      setTimeout(() => {
        setScanState("itemizing");
      }, 2000);
    }, 1000);
  };

  const handleAssignToRoommate = (roommateName: string) => {
    if (selectedItem !== null) {
      setReceiptItems(receiptItems.map(item => 
        item.id === selectedItem 
          ? { ...item, assignedTo: roommateName, splitType: "individual" }
          : item
      ));
      setSelectedItem(null);
    }
  };

  const handleSplitAll = () => {
    if (selectedItem !== null) {
      setReceiptItems(receiptItems.map(item => 
        item.id === selectedItem 
          ? { ...item, assignedTo: "Split", splitType: "split" }
          : item
      ));
      setSelectedItem(null);
    }
  };

  const handlePostToHouse = () => {
    setScanState("summary");
  };

  // Idle/Camera State
  if (scanState === "idle" || scanState === "scanning") {
    return (
      <div className="h-full flex flex-col bg-black">
        {/* Camera Viewfinder */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-96 border-4 border-[#0F8]/50 rounded-2xl relative">
              <div className="absolute -top-2 -left-2 w-8 h-8 border-l-4 border-t-4 border-[#0F8] rounded-tl-xl"></div>
              <div className="absolute -top-2 -right-2 w-8 h-8 border-r-4 border-t-4 border-[#0F8] rounded-tr-xl"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-4 border-b-4 border-[#0F8] rounded-bl-xl"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-4 border-b-4 border-[#0F8] rounded-br-xl"></div>
            </div>
          </div>
          <div className="absolute top-8 left-0 right-0 text-center">
            <p className="text-white text-lg">Align receipt edges</p>
          </div>
        </div>

        {/* Scan Button */}
        <div className="p-8 flex justify-center">
          <button 
            onClick={handleStartScan}
            className="w-20 h-20 rounded-full bg-[#0F8] border-4 border-[#0F8]/30 hover:scale-110 transition-transform"
          >
            <div className="w-full h-full rounded-full bg-[#0F8] flex items-center justify-center">
              <Camera className="h-8 w-8 text-black" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Processing State
  if (scanState === "processing") {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#222]">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-[#333] rounded-2xl"></div>
            <div className="absolute inset-0 border-4 border-t-[#0F8] border-r-transparent border-b-transparent border-l-transparent rounded-2xl animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">🧾</span>
            </div>
          </div>
          <h2 className="text-white mb-2">Analyzing Receipt</h2>
          <p className="text-gray-400">Detecting items and prices...</p>
        </div>
      </div>
    );
  }

  // Summary State
  if (scanState === "summary") {
    const youOwe = assignedAmount - totalAmount;
    const youAreOwed = totalAmount - assignedAmount;
    
    return (
      <div className="h-full flex flex-col bg-[#222]">
        <div className="bg-[#0F8] px-6 pt-16 pb-8 rounded-b-3xl">
          <div className="text-center text-black">
            <div className="w-20 h-20 mx-auto mb-4 bg-black/10 rounded-full flex items-center justify-center">
              <Check className="h-10 w-10" />
            </div>
            <h1 className="mb-2">Receipt Posted!</h1>
            <p className="text-black/70">Your roommates have been notified</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 border border-[#333] mb-4">
            <h3 className="mb-4 text-white">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">You paid:</span>
                <span className="text-white">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Your share:</span>
                <span className="text-white">${(totalAmount / 3).toFixed(2)}</span>
              </div>
              <div className="h-px bg-[#333]"></div>
              <div className="flex justify-between text-lg">
                <span className="text-white">You are owed:</span>
                <span className="text-[#0F8]">${youAreOwed.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-2xl p-6 border border-[#333]">
            <h3 className="mb-4 text-white">Breakdown by Roommate</h3>
            <div className="space-y-3">
              {mockRoommates.map((roommate) => {
                const roommateItems = receiptItems.filter(item => 
                  item.assignedTo === roommate.name || item.splitType === "split"
                );
                const roommateTotal = roommateItems.reduce((sum, item) => 
                  sum + (item.splitType === "split" ? item.price / 3 : item.price), 0
                );
                
                return (
                  <div key={roommate.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${roommate.color} text-black`}>
                          {roommate.initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white">{roommate.name}</span>
                    </div>
                    <span className="text-gray-400">${roommateTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#2a2a2a] border-t border-[#333]">
          <Button 
            onClick={() => setScanState("idle")}
            className="w-full h-14 rounded-xl bg-[#0F8] hover:bg-[#0F8]/90 text-black"
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  // Itemizing State
  return (
    <div className="h-full flex flex-col bg-[#222]">
      {/* Header */}
      <div className="bg-[#2a2a2a] px-6 pt-16 pb-6 border-b border-[#333]">
        <h1 className="mb-2 text-white">Assign Items</h1>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Total: ${totalAmount.toFixed(2)}</span>
          <span className="text-sm text-gray-500">
            {receiptItems.filter(i => i.assignedTo).length} / {receiptItems.length} assigned
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="space-y-2">
          {receiptItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item.id)}
              className={`w-full text-left p-4 rounded-xl transition-colors ${
                selectedItem === item.id 
                  ? "bg-[#0F8]/20 border-2 border-[#0F8]" 
                  : item.assignedTo 
                    ? item.splitType === "split"
                      ? "bg-purple-900/20 border-2 border-purple-500/30"
                      : "bg-[#0F8]/10 border-2 border-[#0F8]/30"
                    : "bg-[#2a2a2a] border-2 border-[#333]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{item.name}</span>
                    {item.assignedTo && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.splitType === "split" 
                          ? "bg-purple-900/30 text-purple-400 border border-purple-700/30"
                          : "bg-[#0F8]/20 text-[#0F8] border border-[#0F8]/30"
                      }`}>
                        {item.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
                <span className="ml-4 text-white">${item.price.toFixed(2)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Assignment Bar */}
      {selectedItem !== null && (
        <div className="bg-[#2a2a2a] border-t border-[#333] p-6">
          <p className="text-sm text-gray-400 mb-4">Assign to...</p>
          <div className="flex items-center gap-3">
            {mockRoommates.map((roommate) => (
              <button
                key={roommate.id}
                onClick={() => handleAssignToRoommate(roommate.name)}
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#333]"
              >
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={`${roommate.color} text-black`}>
                    {roommate.initial}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-white">{roommate.name}</span>
              </button>
            ))}
            <button
              onClick={handleSplitAll}
              className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#333]"
            >
              <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">All</span>
              </div>
              <span className="text-sm text-white">Split</span>
            </button>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="p-6 bg-[#2a2a2a] border-t border-[#333]">
        <Button 
          onClick={handlePostToHouse}
          disabled={receiptItems.some(item => !item.assignedTo)}
          className="w-full h-14 rounded-xl bg-[#0F8] hover:bg-[#0F8]/90 text-black disabled:opacity-50"
        >
          Post to House
        </Button>
      </div>
    </div>
  );
}
