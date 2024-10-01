'use client';
import { useState } from 'react';

export default function PointsInput() {
  // Высоты по умолчанию
  const defaultHeights = [
    [32.97, 29.93, 32.03, 30.84],
    [31.60, 29.93, 32.97, 30.84],
    [30.84, 31.60, 32.03, 31.98],
    [31.98, 32.97, 29.93, 31.60]
  ];

  // Используем состояние для высот
  const [heights, setHeights] = useState(defaultHeights);

  // Обработчик для изменения значений
  const handleInputChange = (i, j, value) => {
    const newHeights = [...heights];
    newHeights[i][j] = parseFloat(value);
    setHeights(newHeights);
  };

  // Отправка данных в API
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ heights }),
      });

      if (response.ok) {
        alert('Результаты отправлены в Telegram!');
      } else {
        alert('Ошибка при отправке данных');
      }
    } catch (error) {
      alert('Произошла ошибка: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}> 
      <table>
        <tbody>
          {heights.map((row, i) => (
            <tr key={i}>
              {row.map((height, j) => (
                <td key={j}>
                  <input
                    type="number"
                    step="0.01"
                    value={height}
                    onChange={(e) => handleInputChange(i, j, e.target.value)}
                    style={{ width: '60px' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button type="submit">Отправить</button>
    </form>
  );
}
