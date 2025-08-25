import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Datos de ejemplo. En el futuro, vendrán de la API.
const data = [
  { name: 'Lun', activity: 12 },
  { name: 'Mar', activity: 19 },
  { name: 'Mié', activity: 15 },
  { name: 'Jue', activity: 25 },
  { name: 'Vie', activity: 22 },
  { name: 'Sáb', activity: 30 },
  { name: 'Dom', activity: 28 },
];

const ActivityChart = ({ title }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg h-64">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
          <XAxis dataKey="name" stroke="#a0aec0" fontSize={12} />
          <YAxis stroke="#a0aec0" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a202c', 
              border: '1px solid #4a5568',
              borderRadius: '0.5rem'
            }} 
          />
          <Line type="monotone" dataKey="activity" stroke="#8B5CF6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityChart;