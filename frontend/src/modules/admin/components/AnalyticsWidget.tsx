import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Users, Eye, Clock, ArrowUpRight } from 'lucide-react';

// Datos de ejemplo (Mock) - Luego vendrán del Backend
const data = [
  { name: 'Lun', visitas: 120, usuarios: 80 },
  { name: 'Mar', visitas: 150, usuarios: 90 },
  { name: 'Mie', visitas: 280, usuarios: 140 },
  { name: 'Jue', visitas: 200, usuarios: 110 },
  { name: 'Vie', visitas: 350, usuarios: 200 },
  { name: 'Sab', visitas: 180, usuarios: 100 },
  { name: 'Dom', visitas: 140, usuarios: 85 },
];

export const AnalyticsWidget = () => {
  return (
    <div className="space-y-6">

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Usuarios Activos</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">1,240</h3>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                        <Users size={20} />
                    </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-green-600 font-bold">
                    <ArrowUpRight size={14} /> +12% <span className="text-gray-400 font-normal ml-1">vs semana pasada</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Vistas de Página</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">3,850</h3>
                    </div>
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                        <Eye size={20} />
                    </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-green-600 font-bold">
                    <ArrowUpRight size={14} /> +5% <span className="text-gray-400 font-normal ml-1">vs semana pasada</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Tiempo Promedio</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">2m 15s</h3>
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg">
                        <Clock size={20} />
                    </div>
                </div>
                 <div className="mt-2 flex items-center text-xs text-gray-400 font-bold">
                    <span>Estable</span>
                </div>
            </div>
        </div>

        {/* Gráfico Principal */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Tendencia de Visitas (Últimos 7 días)</h3>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#800020" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#800020" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#1e293b' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="visitas"
                            stroke="#800020"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVisitas)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">Datos simulados por el momento para demostración.</p>
    </div>
  );
};