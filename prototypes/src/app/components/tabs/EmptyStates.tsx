import { Button } from "../ui/button";

interface EmptyListProps {
  onAddItem: () => void;
}

export function EmptyList({ onAddItem }: EmptyListProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 bg-gray-50">
      <div className="text-center">
        <div className="text-8xl mb-6">🍽️</div>
        <h2 className="mb-3">Fridge is Empty</h2>
        <p className="text-gray-600 mb-8">We're gonna starve. Add some items to the list!</p>
        <Button onClick={onAddItem} className="rounded-xl px-6">
          Add First Item
        </Button>
      </div>
    </div>
  );
}

export function EmptyTransactions() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 bg-gray-50">
      <div className="text-center">
        <div className="text-8xl mb-6">💳</div>
        <h2 className="mb-3">No Debts</h2>
        <p className="text-gray-600">Peace and harmony in the household!</p>
      </div>
    </div>
  );
}

export function EmptyFeed() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 bg-gray-50">
      <div className="text-center">
        <div className="text-8xl mb-6">🏠</div>
        <h2 className="mb-3">Nothing Yet</h2>
        <p className="text-gray-600">Start shopping to see activity here!</p>
      </div>
    </div>
  );
}
