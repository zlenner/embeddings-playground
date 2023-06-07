import './app.css'
import List, { ColorItem } from './components/List'
import { useState } from 'preact/hooks';
import Results from './components/Results';
import { ScoringResult } from './components/typings';

const getScoring = async (items: ColorItem[]): Promise<ScoringResult> => {
  // Post items to embeddings.replit.app and return response
  const response = await fetch('https://embeddings.replit.app/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({items})
  });

  return response.json();
}

export function App() {
  const [loadingScore, setLoadingScore] = useState(false);
  const [scoredColorItems, setScoredColorItems] = useState<ColorItem[]>([]);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);

  const onCompare = async (items: ColorItem[]) => {
    setLoadingScore(true);

    const newScoring = await getScoring(items);

    // Update the state with the new embeddings
    setScoringResult(newScoring);
    setScoredColorItems(items)

    setLoadingScore(false);
  };

  const onChangeCosmetic = (updatedItem: ColorItem, newIndex: number) => {
    setScoredColorItems((prevItems) => {
      const itemIndex = prevItems.findIndex((item) => item.id === updatedItem.id);
      if (itemIndex === -1) return prevItems;
  
      const reorderedItems = Array.from(prevItems);
      const [oldItem] = reorderedItems.splice(itemIndex, 1);
      const newItem = { ...oldItem, color: updatedItem.color };
      reorderedItems.splice(newIndex, 0, newItem);
  
      return reorderedItems;
    });
  };  

  return (
    <>
      <div class="flex w-full h-full p-4">
        <div class="flex w-2/6">
          <List onCompare={onCompare} onChangeCosmetic={onChangeCosmetic} loadingScore={loadingScore} />
        </div>
        <div class="flex w-4/6 p-4 h-full">
          <Results
            scoringResult={scoringResult}
            items={scoredColorItems}
          />
        </div>
      </div>
    </>
  )
}
