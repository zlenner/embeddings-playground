import { ColorItem, ScoringResult } from "../typings";
import Compare1D from "./Compare1D";
import Visualizer3D from "./Visualizer3D";
import Button from "../shared/Button"
import { useState } from "preact/hooks";
import Select from "../shared/Select";
import { ModelType } from "../../app";

interface ResultsProps {
    items: ColorItem[]
    scoringResult: ScoringResult | null
    model: ModelType
    setModel: (model: ModelType) => void
}

function Results({ scoringResult, items, model, setModel }: ResultsProps) {
    const [activeTab, setActiveTab] = useState('1D');

    if (!scoringResult) {
        return (
            <div class="flex w-full flex-col">
                <div class="text-gray-600">Click on "Compare" to see results.</div>
                <a class="mt-auto pb-4 sm:pb-0 mx-auto sm:mx-0" href="https://www.producthunt.com/posts/imbeddit?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-imbeddit" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=777128&theme=light&t=1736751882591" alt="Imbeddit - a&#0032;playground&#0032;to&#0032;experiment&#0032;with&#0032;text&#0032;embeddings | Product Hunt" style="width: 160px;" width="160" /></a>
            </div>
        )
    }

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    return (
        <div class="flex flex-col w-full h-full py-2">
            <div class="flex flex-col space-y-2 sm:space-y-0 sm:flex-row">
                <div class="flex">
                    <Button className="mr-3" selected={activeTab === "1D"} onClick={() => handleTabChange('1D')}>Similarity</Button>
                    <Button selected={activeTab === "3D"} onClick={() => handleTabChange('3D')}>3D Visualization (PCA)</Button>
                </div>
                <Select className="w-fit ml-auto" onChange={(newValue) => {
                    setModel(newValue as ModelType)
                }} value={model}>
                    <option value="openai/text-embedding-3-small">openai/text-embedding-3-small</option>
                    <option value="openai/text-embedding-3-large">openai/text-embedding-3-large</option>
                    <option value="openai/text-embedding-ada-002">openai/text-embedding-ada-002</option>
                    <option value="nvidia/nv-embed-v1">nvidia/nv-embed-v1</option>
                    <option value="voyageai/voyage-3-large">voyageai/voyage-3-large</option>
                    <option value="voyageai/voyage-3-lite">voyageai/voyage-3-lite</option>
                    <option value="voyageai/voyage-3">voyageai/voyage-3</option>
                    <option value="google/text-embedding-004">google/text-embedding-004</option>
                    <option value="google/text-embedding-005">google/text-embedding-005</option>
                </Select>
            </div>
            {activeTab === '1D' && <Compare1D scoringResult={scoringResult} items={items} />}
            {activeTab === '3D' && <Visualizer3D pca={scoringResult.pca} items={items} />}
        </div>
    );
}

export default Results;
