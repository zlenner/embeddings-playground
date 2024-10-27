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
        return <div class="text-gray-600">Click on "Compare" to see results.</div>
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
                    <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                    <option value="text-embedding-3-small">text-embedding-3-small</option>
                    <option value="text-embedding-3-large">text-embedding-3-large</option>
                </Select>
            </div>
            {activeTab === '1D' && <Compare1D scoringResult={scoringResult} items={items} />}
            {activeTab === '3D' && <Visualizer3D pca={scoringResult.pca} items={items} />}
        </div>
    );
}

export default Results;
