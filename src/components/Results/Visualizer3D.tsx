import Plot from 'react-plotly.js';
import { ColorItem, PCA } from '../typings';
import { useEffect, useRef, useState } from 'preact/hooks';

type VisualizerProps = {
    pca: PCA;
    items: ColorItem[];
};

const Visualizer3D = ({ pca, items }: VisualizerProps) => {
    const axisColor = "rgb(209, 250, 229)"

    const data = items.map(item => ({
        ...item,
        ...pca[item.id]
    }));

    const [width, setWidth] = useState<number | undefined>(undefined)
    const [height, setHeight] = useState<number | undefined>(undefined)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setWidth(ref.current?.clientWidth);
        setHeight(Math.min(ref.current?.clientHeight ?? 0, ref.current?.clientWidth ?? 0));
    }, [])

    console.log(height)

    return (
        <div class="flex flex-1">
            <div class="flex w-full h-full" ref={ref}>
                <Plot
                    data={[
                        {
                            type: 'scatter3d',
                            mode: 'markers',
                            x: data.map(item => item.x),
                            y: data.map(item => item.y),
                            z: data.map(item => item.z),
                            marker: {
                                size: 10,
                                color: data.map(item => item.color),
                                opacity: 1
                            },
                            text: data.map(item => item.text)
                        }
                    ]}
                    layout={{
                        autosize: false,
                        width: width,
                        height: height,
                        "scene": {
                            "aspectmode": "cube",
                            "xaxis": {
                                "backgroundcolor": axisColor,
                                "gridcolor": "white",
                                "linecolor": "white",
                                "zerolinecolor": "white",
                                "showbackground": true,
                                "gridwidth": 3,
                            },
                            "yaxis": {
                                "backgroundcolor": axisColor,
                                "gridcolor": "white",
                                "zerolinecolor": "white",
                                "linecolor": "white",
                                "showbackground": true,
                                "gridwidth": 3
                            },
                            "zaxis": {
                                "backgroundcolor": axisColor,
                                "gridcolor": "white",
                                "linecolor": "white",
                                "zerolinecolor": "white",
                                "showbackground": true,
                                "gridwidth": 3
                            }
                        },
                    }}
                />
            </div>
        </div>
    );
}

export default Visualizer3D;
