import { useState } from "react";
import { Plus, Flame, Trash2, UserPlus, X } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

interface ShopItem {
  id: number;
  name: string;
  category: string;
  hasBounty: boolean;
  bountyAmount?: number;
  claimedBy?: string;
  completed: boolean;
}

const mockItems: ShopItem[] = [
  { id: 1, name: "Milk", category: "Dairy", hasBounty: true, bountyAmount: 2.00, completed: false },
  { id: 2, name: "Eggs", category: "Dairy", hasBounty: false, completed: false },
  { id: 3, name: "Bread", category: "Bakery", hasBounty: true, bountyAmount: 1.50, claimedBy: "Sameep", completed: false },
  { id: 4, name: "Chicken Breast", category: "Meat", hasBounty: true, bountyAmount: 3.00, completed: false },
  { id: 5, name: "Bananas", category: "Produce", hasBounty: false, completed: false },
];

const categories = ["Produce", "Dairy", "Meat", "Bakery", "Snacks", "Beverages", "Other"];

export function ShopTab() {
  const [items, setItems] = useState<ShopItem[]>(mockItems);
  const [showAddModal, setShowAddModal] = useState(false);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "Other", hasBounty: false, bountyAmount: 0 });

  const handleToggleComplete = (id: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleDeleteItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleClaimItem = (id: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, claimedBy: "You" } : item
    ));
  };

  const handleAddItem = () => {
    if (newItem.name.trim()) {
      setItems([...items, {
        id: Date.now(),
        name: newItem.name,
        category: newItem.category,
        hasBounty: newItem.hasBounty,
        bountyAmount: newItem.hasBounty ? newItem.bountyAmount : undefined,
        completed: false
      }]);
      setNewItem({ name: "", category: "Other", hasBounty: false, bountyAmount: 0 });
      setShowAddModal(false);
    }
  };

  if (shoppingMode) {
    return (
      <div className="h-full flex flex-col bg-[#0F8]">
        <div className="px-6 pt-16 pb-8 text-center">
          <button onClick={() => setShoppingMode(false)} className="absolute top-16 left-6 text-black">
            <X className="h-6 w-6" />
          </button>
          <div className="w-20 h-20 mx-auto mb-4 bg-black/10 rounded-full flex items-center justify-center">
            <span className="text-4xl">🏪</span>
          </div>
          <h1 className="text-black mb-2">You are at Kroger</h1>
          <p className="text-black/70">Here's what you need</p>
        </div>
        
        <div className="flex-1 bg-[#222] rounded-t-3xl p-6 overflow-auto">
          <div className="space-y-3">
            {items.filter(item => !item.completed).map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-4 bg-[#2a2a2a] rounded-xl border border-[#333]">
                <Checkbox 
                  checked={item.completed}
                  onCheckedChange={() => handleToggleComplete(item.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{item.name}</span>
                    {item.hasBounty && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-900/30 text-orange-400 border border-orange-700/30">
                        <Flame className="h-3 w-3 mr-1" />
                        ${item.bountyAmount?.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{item.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-[#222]">
          <Button className="w-full h-14 rounded-xl bg-[#0F8] hover:bg-[#0F8]/90 text-black">
            Scan Receipt
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#222]">
      {/* Header */}
      <div className="bg-[#2a2a2a] px-6 pt-16 pb-6 border-b border-[#333]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white">Shopping List</h1>
          <Button 
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="rounded-full bg-[#0F8] hover:bg-[#0F8]/90 text-black"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <p className="text-gray-400">{items.filter(i => !i.completed).length} items to buy</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="space-y-2">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="bg-[#2a2a2a] rounded-xl p-4 border border-[#333] relative"
            >
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={item.completed}
                  onCheckedChange={() => handleToggleComplete(item.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={item.completed ? "line-through text-gray-500" : "text-white"}>{item.name}</span>
                    {item.hasBounty && !item.completed && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-900/30 text-orange-400 border border-orange-700/30">
                        <Flame className="h-3 w-3 mr-1" />
                        +${item.bountyAmount?.toFixed(2)}
                      </span>
                    )}
                    {item.claimedBy && !item.completed && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#0F8]/20 text-[#0F8] border border-[#0F8]/30">
                        <UserPlus className="h-3 w-3 mr-1" />
                        {item.claimedBy}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{item.category}</span>
                </div>
                <div className="flex gap-2">
                  {!item.claimedBy && !item.completed && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleClaimItem(item.id)}
                      className="text-[#0F8] hover:bg-[#0F8]/10"
                    >
                      Claim
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDeleteItem(item.id)}
                    className="hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.filter(i => !i.completed).length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="mb-2 text-white">All Done!</h3>
            <p className="text-gray-400">Add items to get started</p>
          </div>
        )}
      </div>

      {/* Shopping Mode Button */}
      <div className="p-6 bg-[#2a2a2a] border-t border-[#333]">
        <Button 
          onClick={() => setShoppingMode(true)}
          className="w-full h-14 rounded-xl bg-[#0F8] hover:bg-[#0F8]/90 text-black"
        >
          I'm Shopping Now
        </Button>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/70 flex items-end z-50">
          <div className="w-full bg-[#2a2a2a] rounded-t-3xl p-6 animate-in slide-in-from-bottom border-t border-[#333]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white">Add Item</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-white">Item Name</Label>
                <Input 
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Organic Milk"
                  className="mt-2 bg-[#333] border-[#444] text-white"
                />
              </div>

              <div>
                <Label className="text-white">Category</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewItem({ ...newItem, category: cat })}
                      className={`px-4 py-2 rounded-full text-sm ${
                        newItem.category === cat 
                          ? "bg-[#0F8] text-black" 
                          : "bg-[#333] text-gray-300 border border-[#444]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Add Bounty</Label>
                  <p className="text-sm text-gray-400">Incentivize this item</p>
                </div>
                <Switch 
                  checked={newItem.hasBounty}
                  onCheckedChange={(checked) => setNewItem({ ...newItem, hasBounty: checked })}
                />
              </div>

              {newItem.hasBounty && (
                <div>
                  <Label className="text-white">Bounty Amount</Label>
                  <Input 
                    type="number"
                    step="0.50"
                    value={newItem.bountyAmount}
                    onChange={(e) => setNewItem({ ...newItem, bountyAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="mt-2 bg-[#333] border-[#444] text-white"
                  />
                </div>
              )}
            </div>

            <Button 
              onClick={handleAddItem}
              className="w-full h-12 rounded-xl mt-6 bg-[#0F8] hover:bg-[#0F8]/90 text-black"
            >
              Add to List
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
