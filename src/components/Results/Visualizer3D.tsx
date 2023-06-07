import Plot from 'react-plotly.js';
import { ColorItem, PCA } from '../typings';

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

    return (
        <div class="flex flex-1">
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
    );
}

export default Visualizer3D;
