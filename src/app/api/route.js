import fs from 'fs';
import fetch from 'node-fetch';

export async function POST(req) {
  try {
    const { heights } = await req.json();

    const gridSize = 4;
    const distanceBetweenPoints = 4;
    const step = 0.25;

    function roundDownToNearest(value, multiple) {
      return Math.floor(value / multiple) * multiple;
    }

    function getWaterLevels(heights) {
      const maxHeight = Math.max(...heights.flat());
      const minHeight = Math.min(...heights.flat());
      let waterLevels = [];

      for (let level = roundDownToNearest(maxHeight, step); level >= minHeight; level -= step) {
        waterLevels.push(level);
      }

      return waterLevels;
    }

    function getPointsOnEdges(heights) {
      const edges = {};
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const currentPoint = {
            point: `${getPointNumber(i, j)}`,
            height: heights[i][j],
            coordinates: { x: j * distanceBetweenPoints, y: i * distanceBetweenPoints },
          };

          if (j < gridSize - 1) {
            const edgeName = `${getPointNumber(i, j)}-${getPointNumber(i, j + 1)}`;
            edges[edgeName] = [
              currentPoint.coordinates,
              { x: (j + 1) * distanceBetweenPoints, y: i * distanceBetweenPoints },
            ];
          }

          if (i < gridSize - 1) {
            const edgeName = `${getPointNumber(i, j)}-${getPointNumber(i + 1, j)}`;
            edges[edgeName] = [
              currentPoint.coordinates,
              { x: j * distanceBetweenPoints, y: (i + 1) * distanceBetweenPoints },
            ];
          }
        }
      }

      return edges;
    }

    function getPointNumber(i, j) {
      return i * gridSize + j + 1;
    }

    const waterLevels = getWaterLevels(heights);
    const edges = getPointsOnEdges(heights);

    const jsonOutput = {
      points: [],
      waterLevels: {},
    };

    // Заполняем точки в jsonOutput
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        jsonOutput.points.push({
          pointName: getPointNumber(i, j),
          height: heights[i][j].toFixed(2),
          coordinates: { x: j * distanceBetweenPoints, y: i * distanceBetweenPoints },
        });
      }
    }

    // Заполняем уровни воды
    waterLevels.forEach((level) => {
      jsonOutput.waterLevels[level] = {};
      Object.keys(edges).forEach((edge) => {
        const points = edges[edge];
        const [p1, p2] = points.map((p) => heights[Math.floor(p.y / distanceBetweenPoints)][Math.floor(p.x / distanceBetweenPoints)]);
        if ((p1 >= level && p2 <= level) || (p1 <= level && p2 >= level)) {
          const ratio = (level - p1) / (p2 - p1);
          const intermediatePoint = {
            x: points[0].x + ratio * (points[1].x - points[0].x),
            y: points[0].y + ratio * (points[1].y - points[0].y),
          };

          jsonOutput.waterLevels[level][edge] = {
            waterLevel: level.toFixed(2),
            coordinates: intermediatePoint,
          };
        }
      });
    });
 

    // Отправляем координаты точек в Telegram
    const telegramToken = '7262582449:AAHsyNFn9XFbrSNH4rh2wGDxoxqm4ZQoOt4';
    const chatId = '1255161158';
    const pointsMessage = `Координаты точек:\n${jsonOutput.points.map(point => `Точка ${point.pointName}: (${point.coordinates.x}, ${point.coordinates.y})`).join('\n')}`;
    
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: pointsMessage,
      }),
    });

    // Отправляем высоты по отдельности, начиная с наименьшей
    for (const level of waterLevels.sort((a, b) => a - b)) {
      const levelMessage = `Уровень воды: ${level.toFixed(2)}\n`;
      const edgesMessage = Object.keys(jsonOutput.waterLevels[level]).map(edge => {
        const coords = jsonOutput.waterLevels[level][edge].coordinates;
        return `Ребро ${edge}: (x: ${coords.x.toFixed(2)}, y: ${coords.y.toFixed(2)})`;
      }).join('\n');

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: levelMessage + edgesMessage,
        }),
      });
    }

    // Возвращаем ответ с успешным результатом
    return new Response(JSON.stringify({ success: true, data: jsonOutput }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error details:', error);
    return new Response(JSON.stringify({ message: 'Ошибка сервера', error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
}

}

export async function GET() {
  return new Response(JSON.stringify({ message: 'Метод GET не поддерживается' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
