import { DollarSign, Plus, Trophy } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Progress } from "../ui/progress";

interface HomeTabProps {
  houseName: string;
}

const mockRoommates = [
  { id: 1, name: "Sameep", initial: "S", color: "bg-[#0F8]", spent: 145, trips: 8 },
  { id: 2, name: "Alex", initial: "A", color: "bg-purple-500", spent: 120, trips: 6 },
  { id: 3, name: "Jordan", initial: "J", color: "bg-blue-500", spent: 98, trips: 5 },
];

const mockFeed = [
  { id: 1, type: "added", user: "Sameep", item: "Milk", time: "2 hours ago", icon: "🥛" },
  { id: 2, type: "payment", user: "Alex", recipient: "Sameep", amount: 12.50, time: "3 hours ago" },
  { id: 3, type: "claimed", user: "Jordan", item: "Eggs", bounty: 2.00, time: "5 hours ago", icon: "🥚" },
  { id: 4, type: "added", user: "Alex", item: "Bread", time: "1 day ago", icon: "🍞" },
  { id: 5, type: "completed", user: "Sameep", items: 8, amount: 45.20, time: "1 day ago" },
];

export function HomeTab({ houseName }: HomeTabProps) {
  const maxSpent = Math.max(...mockRoommates.map(r => r.spent));

  return (
    <div className="h-full flex flex-col bg-[#222]">
      {/* Header */}
      <div className="bg-[#2a2a2a] px-6 pt-16 pb-8 rounded-b-3xl border-b border-[#333]">
        <p className="text-gray-400 text-sm mb-1">Your Household</p>
        <h1 className="text-white mb-6">{houseName}</h1>
        
        {/* Mini Leaderboard */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#0F8]" />
              <h3 className="text-white">Top Contributors</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            {mockRoommates.map((roommate, index) => (
              <div key={roommate.id} className="flex items-center gap-3">
                <span className="text-gray-500 w-4">{index + 1}</span>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={`${roommate.color} text-black`}>
                    {roommate.initial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm">{roommate.name}</span>
                    <span className="text-gray-300 text-sm">${roommate.spent}</span>
                  </div>
                  <Progress value={(roommate.spent / maxSpent) * 100} className="h-2 bg-[#333]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <h3 className="mb-4 text-gray-400">Recent Activity</h3>
        <div className="space-y-3">
          {mockFeed.map((event) => (
            <div key={event.id} className="bg-[#2a2a2a] rounded-xl p-4 border border-[#333]">
              {event.type === "added" && (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{event.icon}</span>
                  <div className="flex-1">
                    <p className="text-white">
                      <strong className="text-[#0F8]">{event.user}</strong> added {event.item}
                    </p>
                    <p className="text-sm text-gray-500">{event.time}</p>
                  </div>
                </div>
              )}
              
              {event.type === "payment" && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#0F8]/20 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-[#0F8]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white">
                      <strong className="text-[#0F8]">{event.user}</strong> paid <strong className="text-[#0F8]">{event.recipient}</strong> ${event.amount}
                    </p>
                    <p className="text-sm text-gray-500">{event.time}</p>
                  </div>
                </div>
              )}

              {event.type === "claimed" && (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{event.icon}</span>
                  <div className="flex-1">
                    <p className="text-white">
                      <strong className="text-[#0F8]">{event.user}</strong> claimed {event.item}
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-900/30 text-orange-400 border border-orange-700/30">
                        🔥 +${event.bounty}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">{event.time}</p>
                  </div>
                </div>
              )}

              {event.type === "completed" && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#0F8]/20 rounded-full flex items-center justify-center">
                    <span className="text-sm text-[#0F8]">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">
                      <strong className="text-[#0F8]">{event.user}</strong> completed a shopping trip
                      <span className="ml-2 text-gray-400">({event.items} items, ${event.amount})</span>
                    </p>
                    <p className="text-sm text-gray-500">{event.time}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <div className="absolute bottom-24 right-6">
        <Button className="h-14 w-14 rounded-full shadow-lg shadow-[#0F8]/20 bg-[#0F8] hover:bg-[#0F8]/90 text-black">
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
