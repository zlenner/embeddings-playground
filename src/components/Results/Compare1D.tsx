import { Scatter } from 'react-chartjs-2';
import { Chart, LinearScale, PointElement, Tooltip } from 'chart.js';
import { useMemo } from 'preact/hooks';

interface TextData {
  color: string;
  text: string;
  score: number;
}

interface IProps {
  texts: TextData[];
}

Chart.register(LinearScale, Tooltip, PointElement);

function Compare1D({ texts }: IProps) {
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
    <div className="flex py-6 px-4 flex-1 w-full">
      <div className="relative h-full w-full">
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
