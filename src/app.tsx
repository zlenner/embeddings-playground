import './app.css'
import List, { ColorItem } from './components/List'
import { useEffect, useState } from 'preact/hooks';
import Results from './components/Results';
import { ScoringResult } from './components/typings';
import FundsAccountSlider, { FundsAccountType } from './components/FundsAccountSlider';

export type ModelType = 
  | "openai/text-embedding-3-small"
  | "openai/text-embedding-3-large" 
  | "openai/text-embedding-ada-002"
  | "nvidia/nv-embed-v1"
  | "voyageai/voyage-3-large"
  | "voyageai/voyage-3-lite"
  | "voyageai/voyage-3"
  | "google/text-embedding-004"
  | "google/text-embedding-005";

const getScoring = async (model: ModelType, items: ColorItem[]): Promise<ScoringResult> => {
  // Post items to hades.imbeddit.com and return response
  const response = await fetch('https://hades.imbeddit.com/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({model, items})
  });

  return response.json();
}

const getRemainingFunds = async () => {
  const response = await fetch('https://hades.imbeddit.com/remaining_funds', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return response.json();
}

export function App() {
  const [loadingScore, setLoadingScore] = useState(false);
  const [scoredColorItems, setScoredColorItems] = useState<ColorItem[]>([]);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [model, setModel] = useState<ModelType>("openai/text-embedding-3-small");
  const [fundsAccount, setFundsAccount] = useState<FundsAccountType | null>(null);

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

  useEffect(() => {
    getRemainingFunds().then(funds => {
      setFundsAccount(funds);
    })
  }, []);

  return (
    <div class="flex flex-col w-full h-full">
      <FundsAccountSlider account={fundsAccount} />
      <div class="flex flex-col flex-1 overflow-auto sm:flex-row w-full h-full space-y-6 sm:!space-y-0 space-x-0 sm:!space-x-4">
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
    </div>
  )
}
