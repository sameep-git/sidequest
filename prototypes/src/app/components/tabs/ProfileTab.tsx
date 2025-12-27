import { TrendingUp, ShoppingBag, Trophy, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

const mockDebts = [
  { id: 1, name: "Alex", amount: 15.00, color: "bg-purple-500" },
  { id: 2, name: "Jordan", amount: 8.50, color: "bg-blue-500" },
];

const mockOwed = [
  { id: 1, name: "Sameep", amount: 12.50, color: "bg-[#0F8]" },
];

export function ProfileTab() {
  const handlePayWithVenmo = (name: string, amount: number) => {
    // Simulate Venmo deep link
    alert(`Opening Venmo to pay ${name} $${amount.toFixed(2)}`);
  };

  return (
    <div className="h-full flex flex-col bg-[#222] overflow-auto">
      {/* Header */}
      <div className="bg-[#2a2a2a] px-6 pt-16 pb-12 rounded-b-3xl border-b border-[#333]">
        <div className="text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-[#0F8]/30">
            <AvatarFallback className="bg-[#0F8] text-black text-3xl">
              Y
            </AvatarFallback>
          </Avatar>
          <h1 className="text-white mb-1">You</h1>
          <p className="text-gray-400">Member since Dec 2024</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 -mt-8 mb-6">
        <div className="bg-[#2a2a2a] rounded-2xl p-6 border border-[#333]">
          <h3 className="mb-4 text-white">Your Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <div className="w-12 h-12 mx-auto mb-2 bg-[#0F8]/20 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-[#0F8]" />
              </div>
              <div className="text-2xl mb-1 text-white">8</div>
              <div className="text-sm text-gray-400">Trips Made</div>
            </div>
            
            <div className="text-center p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <div className="w-12 h-12 mx-auto mb-2 bg-orange-900/30 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-orange-400" />
              </div>
              <div className="text-2xl mb-1 text-white">12</div>
              <div className="text-sm text-gray-400">Bounties Claimed</div>
            </div>
            
            <div className="text-center p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <div className="w-12 h-12 mx-auto mb-2 bg-[#0F8]/20 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-[#0F8]" />
              </div>
              <div className="text-2xl mb-1 text-white">$145</div>
              <div className="text-sm text-gray-400">Total Spent</div>
            </div>
            
            <div className="text-center p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <div className="w-12 h-12 mx-auto mb-2 bg-purple-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-2xl mb-1 text-white">92%</div>
              <div className="text-sm text-gray-400">Reliability</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reliability Score Detail */}
      <div className="px-6 mb-6">
        <div className="bg-[#2a2a2a] rounded-2xl p-6 border border-[#333]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white">Reliability Score</h3>
            <span className="text-2xl text-[#0F8]">92%</span>
          </div>
          <Progress value={92} className="h-3 mb-4 bg-[#333]" />
          <p className="text-sm text-gray-400">
            Based on completed trips, claimed bounties, and payment history. Keep it up! 🎉
          </p>
        </div>
      </div>

      {/* You Owe */}
      {mockDebts.length > 0 && (
        <div className="px-6 mb-6">
          <h3 className="mb-3 text-gray-400">You Owe</h3>
          <div className="space-y-3">
            {mockDebts.map((debt) => (
              <div key={debt.id} className="bg-[#2a2a2a] rounded-xl p-4 border border-[#333]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={`${debt.color} text-white`}>
                        {debt.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm text-gray-400">You owe {debt.name}</div>
                      <div className="text-xl text-white">${debt.amount.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => handlePayWithVenmo(debt.name, debt.amount)}
                  className="w-full bg-[#008CFF] hover:bg-[#0077D6] rounded-xl text-white"
                >
                  Pay with Venmo
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* You're Owed */}
      {mockOwed.length > 0 && (
        <div className="px-6 mb-6">
          <h3 className="mb-3 text-gray-400">You're Owed</h3>
          <div className="space-y-3">
            {mockOwed.map((owed) => (
              <div key={owed.id} className="bg-[#2a2a2a] rounded-xl p-4 border-2 border-[#0F8]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={`${owed.color} text-black`}>
                        {owed.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm text-gray-400">{owed.name} owes you</div>
                      <div className="text-xl text-[#0F8]">${owed.amount.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Debts */}
      {mockDebts.length === 0 && mockOwed.length === 0 && (
        <div className="px-6 mb-6">
          <div className="bg-[#2a2a2a] rounded-2xl p-12 text-center border border-[#333]">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="mb-2 text-white">No Debts</h3>
            <p className="text-gray-400">Peace and harmony in the house!</p>
          </div>
        </div>
      )}

      <div className="h-24"></div>
    </div>
  );
}
