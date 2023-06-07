import { ColorItem, ScoringResult } from "../typings";
import Compare1D from "./Compare1D";
import Visualizer3D from "./Visualizer3D";
import Button from "../shared/Button"
import { useState } from "preact/hooks";
import Select from "../shared/Select";

interface ResultsProps {
    items: ColorItem[]
    scoringResult: ScoringResult | null
}

function Results({ scoringResult, items }: ResultsProps) {
    const [activeTab, setActiveTab] = useState('1D');
    const [similarityMethod, setSimilarityMethod] = useState('cosine');

    if (!scoringResult) {
        return <div class="text-gray-600">Click on "Compare" to see results.</div>
    }

    const mainId = items[0].id;
    const texts = items.map((item) => {
        //@ts-ignore
        const score = item.id !== mainId ? scoringResult.similarity[similarityMethod][mainId][item.id] : 0;
        return { 
            color: item.color, 
            text: item.text, 
            score: score 
        };
    });

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const handleMethodChange = (method: string) => {
        setSimilarityMethod(method);
    };

    return (
        <div class="flex flex-col w-full h-full">
            <div class="flex">
                <Button className="mr-3" selected={activeTab === "1D"} onClick={() => handleTabChange('1D')}>Similarity</Button>
                <Button selected={activeTab === "3D"} onClick={() => handleTabChange('3D')}>3D Visualization (PCA)</Button>
            </div>
            {activeTab === '1D' && (
                    <div class="flex flex-col flex-1">
                        <Select className="w-fit mt-3 ml-auto" onChange={(e) => handleMethodChange((e as any).target.value)}>
                            <>
                                <option value="cosine">Cosine</option>
                                <option value="euclidean">Euclidean</option>
                            </>
                        </Select>
                        <Compare1D texts={texts} />
                    </div>

            )}
            {activeTab === '3D' && <Visualizer3D pca={scoringResult.pca} items={items} />}
        </div>
    );
}

export default Results;
