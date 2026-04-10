import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: any[];
  color?: string;
}

export const BurnChart = ({ data, color = "#10b981" }: ChartProps) => {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#334155" 
            vertical={false} 
            opacity={0.3} 
          />
          
          <XAxis 
            dataKey="timestamp" 
            hide 
          />
          
          <YAxis 
            stroke="#64748b" 
            fontSize={10} 
            fontWeight="bold"
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `$${val > 999 ? (val/1000).toFixed(0) + 'k' : val}`} 
          />
          
          <Tooltip 
            cursor={{ stroke: '#475569', strokeWidth: 2 }}
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155', 
              borderRadius: '16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
              padding: '12px'
            }}
            itemStyle={{ color: color, fontWeight: '900', fontSize: '14px' }}
            labelStyle={{ display: 'none' }}
            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Amount']}
          />
          
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke={color} 
            strokeWidth={4} 
            fillOpacity={1} 
            fill="url(#colorValue)" 
            animationDuration={1500}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};