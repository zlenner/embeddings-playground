import { Scatter } from 'react-chartjs-2';
import { Chart, LinearScale, PointElement, Tooltip } from 'chart.js';
import { useMemo, useState } from 'preact/hooks';
import Select from "../shared/Select";
import { ScoringResult, ColorItem } from "../typings";

interface IProps {
  scoringResult: ScoringResult;
  items: ColorItem[];
}

Chart.register(LinearScale, Tooltip, PointElement);

function Compare1D({ scoringResult, items }: IProps) {
  const [similarityMethod, setSimilarityMethod] = useState('cosine');

  const texts = useMemo(() => {
    const mainId = items[0].id;
    return items.map((item) => {
      //@ts-ignore
      const score = item.id !== mainId ? scoringResult.similarity[similarityMethod][mainId][item.id] : 0;
      return {
        color: item.color,
        text: item.text,
        score: score
      };
    });
  }, [items, scoringResult, similarityMethod]);

  const handleMethodChange = (method: string) => {
    setSimilarityMethod(method);
  };

  const chartData = useMemo(() => {
    const data = texts.map(({ color, text, score }, index) => ({
      x: score,
      y: index, // Set y as index to create unique y values
      label: text,
      backgroundColor: color,
    }));


    return {
      datasets: [
        {
          data,
          pointBackgroundColor: data.map(({ backgroundColor }) => backgroundColor),
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  }, [texts]);

  return (
    <div className="flex flex-col py-6 px-4 flex-1 w-full">
      <Select className="w-fit mt-3 ml-auto" onChange={(e) => handleMethodChange((e as any).target.value)}>
        <>
          <option value="cosine">Cosine</option>
          <option value="euclidean">Euclidean</option>
        </>
      </Select>
      <div className="relative h-full w-full flex-1">
        <Scatter data={chartData} options={{
          scales: {
            y: {
              display: true, // Enable y axis display
              reverse: true, // Invert the y axis
              // Map y values (indexes) to corresponding text
              ticks: {
                //@ts-ignore
                callback: (value, index, values) => {
                  return texts[value as number]?.text
                },
              },
            },
          },
          plugins: {
            tooltip: {
              xAlign: "center",
              yAlign: "top",
              enabled: true,
              displayColors: false,
              backgroundColor: "rgb(16, 185, 129)",
              bodyFont: {
                weight: 'bold',
              },
              callbacks: {
                //@ts-ignore
                label: (context) => (context.raw.x as number).toFixed(6),
              },
            },
          },
          maintainAspectRatio: false,
        }}
        />
      </div>
    </div>
  );
}

export default Compare1D;
