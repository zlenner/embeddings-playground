import './app.css'
import List, { ColorItem } from './components/List'
import { useEffect, useState } from 'preact/hooks';
import Results from './components/Results';
import { ScoringResult } from './components/typings';

export type ModelType = "text-embedding-ada-002" | "text-embedding-3-small" | "text-embedding-3-large";

const getScoring = async (model: ModelType, items: ColorItem[]): Promise<ScoringResult> => {
  // Post items to embeddings.replit.app and return response
  const response = await fetch('https://embeddings.replit.app/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({model, items})
  });

  return response.json();
}

export function App() {
  const [loadingScore, setLoadingScore] = useState(false);
  const [scoredColorItems, setScoredColorItems] = useState<ColorItem[]>([]);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [model, setModel] = useState<ModelType>("text-embedding-3-small");

  const onCompare = async (items: ColorItem[]) => {
    setLoadingScore(true);

    const newScoring = await getScoring(model, items);

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

  useEffect(() => {
    if (scoredColorItems.length > 0) {
      onCompare(scoredColorItems);
    }
  }, [model])

  return (
    <>
      <div class="flex flex-col sm:flex-row w-full h-full space-y-6 sm:!space-y-0 space-x-0 sm:!space-x-4">
        <div class="flex w-full sm:w-2/6 pt-4 sm:pb-4">
          <List onCompare={onCompare} onChangeCosmetic={onChangeCosmetic} loadingScore={loadingScore} />
        </div>
        <div class="flex w-full sm:w-4/6 h-full px-4 sm:px-0 sm:py-4 sm:pr-4">
          <Results
            model={model}
            setModel={(newValue) => {
              setModel(newValue)
            }}
            scoringResult={scoringResult}
            items={scoredColorItems}
          />
        </div>
      </div>
    </>
  )
}
