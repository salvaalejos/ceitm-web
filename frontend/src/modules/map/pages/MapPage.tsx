import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    Search, X, Navigation, Info, Layers, Crosshair,
    BookOpen, FlaskConical, Monitor, Utensils, FileText, Briefcase, Footprints, Clock
} from 'lucide-react';
import { useTheme } from '../../../shared/hooks/useTheme';
// 👇 Importamos los servicios y tipos reales
import { getBuildings, getBuildingById, searchMap } from '../../../shared/services/api';
import type { Building, MapSearchResult } from '../../../shared/types';

// --- CONFIGURACIÓN ---
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FsdmFhbGVqb3MiLCJhIjoiY21rZGZ4ZmUzMGJ6bzNmcTc5dW53MjZ5YiJ9.frpiERMPQTU5-TcKBHzP0Q';

// Posición simulada (Entrada del Tec)
const MOCK_USER_POS = [-101.18598, 19.72146] as [number, number];

const ITM_BOUNDS = [
    [-101.1950, 19.7150], // SW
    [-101.1750, 19.7300]  // NE
] as [number, number, number, number];

// --- AYUDANTES DE ESTILO ---
const getCategoryColor = (category: string) => {
    switch (category?.toUpperCase()) {
        case 'AULAS': return '#2563eb';      // Azul
        case 'LABS': return '#7c3aed';       // Violeta
        case 'ADMINISTRATIVO': return '#1e293b'; // Gris Oscuro
        case 'SERVICIOS': return '#10b981';  // Verde
        case 'ALIMENTOS': return '#f97316';  // Naranja
        case 'AREAS_VERDES': return '#65a30d'; // Verde Limón
        default: return '#64748b';           // Gris
    }
};

const getRoomStyle = (type?: string) => { // Acepta string o undefined
    // Convertimos a mayúsculas para evitar errores si viene "Lab" en vez de "LAB"
    const safeType = type ? type.toUpperCase() : 'DEFAULT';

    switch(safeType) {
        case 'LAB': return { icon: <FlaskConical size={14}/>, color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' };
        case 'CC':
        case 'PC': return { icon: <Monitor size={14}/>, color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800' };
        case 'FOOD': return { icon: <Utensils size={14}/>, color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' };
        case 'OFFICE': return { icon: <FileText size={14}/>, color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
        case 'AUDITORIUM': return { icon: <Briefcase size={14}/>, color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' };
        default: return { icon: <BookOpen size={14}/>, color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' };
    }
};

// Helper para formato de piso (PB, P1, P2...)
const formatFloor = (floor: string) => {
    if (floor === 'PB') return 'Planta Baja';
    return `Piso ${floor}`;
};

const MapPage = () => {
    const { theme } = useTheme();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

    // Estado con tipos reales
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [activeBuilding, setActiveBuilding] = useState<Building | null>(null);

    // Estado de interfaz
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<MapSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [routeInfo, setRouteInfo] = useState<{duration: number, distance: number} | null>(null);

    // --- 1. CARGAR MAPA Y DATOS INICIALES ---
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        const initMap = new mapboxgl.Map({
            container: mapContainer.current,
            style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
            center: [-101.1855, 19.7228],
            zoom: 16.5,
            minZoom: 15,
            maxZoom: 22,
            maxBounds: ITM_BOUNDS,
            attributionControl: false,
            pitch: 45,
        });

        initMap.on('load', async () => {
            initMap.resize();
            map.current = initMap;

            // Cargar edificios de la API
            try {
                const data = await getBuildings();
                setBuildings(data);
            } catch (error) {
                console.error("Error cargando edificios:", error);
            }
        });

        initMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

        return () => { initMap.remove(); map.current = null; };
    }, []);

    // --- 2. RENDERIZAR MARCADORES (Cuando 'buildings' cambie) ---
    useEffect(() => {
        if (!map.current || buildings.length === 0) return;
        renderMarkers();
    }, [buildings]);

    // --- CAMBIO DE TEMA ---
    useEffect(() => {
        if (!map.current) return;
        const style = theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
        map.current.setStyle(style);
    }, [theme]);


    const renderMarkers = () => {
        if (!map.current) return;

        // Limpiar anteriores
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        buildings.forEach(b => {
            if (!b.coordinates || !b.coordinates.lat || !b.coordinates.lng) return;

            const color = getCategoryColor(b.category);
            const container = document.createElement('div');
            container.className = 'group';
            container.style.cursor = 'pointer';

            container.innerHTML = `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                    <div style="
                        background-color: ${color};
                        width: 40px; height: 40px;
                        border-radius: 12px;
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 0 15px ${color}80;
                        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    " class="group-hover:-translate-y-2 group-hover:scale-110">
                        <span style="color: white; font-weight: 800; font-family: sans-serif; font-size: 14px;">${b.code || b.id}</span>
                    </div>
                    <div style="
                        width: 0; height: 0; 
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-top: 8px solid ${color};
                        margin-top: -2px;
                        opacity: 0.9;
                    " class="group-hover:-translate-y-2"></div>
                </div>
            `;

            container.addEventListener('click', (e) => {
                e.stopPropagation();
                handleBuildingSelect(b);
            });

            const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' })
                .setLngLat([b.coordinates.lng, b.coordinates.lat])
                .addTo(map.current!);

            markersRef.current.push(marker);
        });
    };

    // --- 3. SELECCIÓN DE EDIFICIO (Cargar Detalle) ---
    const handleBuildingSelect = async (b: Partial<Building>) => {
        if (b.coordinates?.lng && b.coordinates?.lat && b.id) {
            map.current?.flyTo({ center: [b.coordinates.lng, b.coordinates.lat], zoom: 19, pitch: 60, duration: 1500 });
            clearRoute();

            try {
                const detailedBuilding = await getBuildingById(b.id);
                setActiveBuilding(detailedBuilding);
            } catch (error) {
                console.error("Error obteniendo detalle:", error);
                setActiveBuilding(b as Building);
            }
        }
    };

    // --- 4. BÚSQUEDA ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchText.length > 0) {
                setIsSearching(true);
                try {
                    const results = await searchMap(searchText);
                    setSearchResults(results);
                } catch (error) {
                    console.error("Error buscando:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchText]);


    // --- 5. NAVEGACIÓN ---
    const handleSimulateGPS = () => {
        if (!map.current) return;
        const pos = MOCK_USER_POS;
        setUserLocation(pos);
        if (userMarkerRef.current) userMarkerRef.current.remove();

        const el = document.createElement('div');
        el.className = 'user-marker';
        el.innerHTML = `
            <span class="relative flex h-4 w-4">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white shadow-lg"></span>
            </span>
        `;

        userMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat(pos)
            .addTo(map.current);

        map.current.flyTo({ center: pos, zoom: 17.5, pitch: 30 });
    };

    const getRoute = async (start: [number, number], end: [number, number]) => {
        if (!map.current) return;
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const json = await query.json();
        if (!json.routes || json.routes.length === 0) return;

        const data = json.routes[0];
        const route = data.geometry.coordinates;

        setRouteInfo({
            duration: Math.round(data.duration / 60),
            distance: Math.round(data.distance)
        });

        const geojson: any = {
          type: 'Feature', properties: {},
          geometry: { type: 'LineString', coordinates: route }
        };

        if (map.current.getSource('route')) {
            (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(geojson);
        } else {
            map.current.addLayer({
                id: 'route', type: 'line',
                source: { type: 'geojson', data: geojson },
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#800020', 'line-width': 5, 'line-opacity': 0.8, 'line-dasharray': [0, 2] }
            });
        }
    };

    const clearRoute = () => {
        if (map.current?.getLayer('route')) map.current.removeLayer('route');
        if (map.current?.getSource('route')) map.current.removeSource('route');
        setRouteInfo(null);
    };

    const handleNavigate = () => {
        if (!activeBuilding?.coordinates?.lat || !activeBuilding?.coordinates?.lng) return;
        const dest: [number, number] = [activeBuilding.coordinates.lng, activeBuilding.coordinates.lat];

        if (!userLocation) {
            handleSimulateGPS();
            setTimeout(() => { getRoute(MOCK_USER_POS, dest); }, 500);
        } else {
            getRoute(userLocation, dest);
        }
    };

    const buildingColor = activeBuilding ? getCategoryColor(activeBuilding.category) : '#2563eb';

    return (
        <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-gray-200 dark:bg-slate-900">
            {/* MAPA */}
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

            {/* INFO RUTA */}
            {routeInfo && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-guinda-600 text-white px-4 py-2 rounded-full shadow-xl z-30 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-1"><Clock size={16} /><span className="font-bold">{routeInfo.duration} min</span></div>
                    <div className="w-px h-4 bg-white/30"></div>
                    <div className="flex items-center gap-1"><Footprints size={16} /><span className="font-bold">{routeInfo.distance} m</span></div>
                    <button onClick={clearRoute} className="ml-2 bg-white/20 rounded-full p-1 hover:bg-white/40"><X size={14}/></button>
                </div>
            )}

            {/* BUSCADOR */}
            <div className="absolute top-4 left-4 right-4 md:right-auto md:w-96 z-10">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-3 flex items-center gap-2">
                        <Search className="text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar edificio, salón..."
                            className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400"
                            value={searchText}
                            onChange={(e) => { setSearchText(e.target.value); if(e.target.value) setActiveBuilding(null); }}
                        />
                        {searchText && <button onClick={() => setSearchText('')}><X size={16} className="text-gray-400" /></button>}
                    </div>
                    {/* RESULTADOS DE BÚSQUEDA */}
                    {searchText && (
                        <div className="max-h-60 overflow-y-auto border-t border-gray-100 dark:border-slate-800">
                            {isSearching ? (
                                <div className="p-4 text-center text-xs text-gray-400">Buscando...</div>
                            ) : searchResults.length > 0 ? searchResults.map((result) => {

                                // 👇 AQUI ESTA LA CORRECCIÓN: Usamos category para el estilo
                                const isRoom = result.type === 'ROOM';
                                const roomStyle = isRoom ? getRoomStyle(result.category) : null;
                                const buildingColor = !isRoom ? getCategoryColor(result.detail) : '#ccc';

                                return (
                                    <div
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => {
                                            handleBuildingSelect({
                                                id: result.building_id,
                                                coordinates: result.coordinates
                                            });
                                            setSearchText('');
                                        }}
                                        className="p-3 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3 border-b border-gray-50 dark:border-slate-800 last:border-0 group transition-colors"
                                    >
                                        {/* ICONO */}
                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm transition-transform group-hover:scale-105 
                                                ${isRoom ? roomStyle?.color : ''} 
                                            `}
                                            style={!isRoom ? { backgroundColor: buildingColor } : {}}
                                        >
                                            {/* Si es salón, pintamos SU icono especifico */}
                                            {isRoom ? roomStyle?.icon : result.name.charAt(0)}
                                        </div>

                                        <div className="flex flex-col overflow-hidden">
                                            <div className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">
                                                {result.name}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                {isRoom && <span className="opacity-70">📍 En</span>}
                                                {result.detail}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : <div className="p-4 text-center text-xs text-gray-400">Sin resultados</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* DETALLES DEL EDIFICIO */}
            {activeBuilding && (
                <div className="absolute bottom-0 inset-x-0 md:bottom-6 md:left-6 md:right-auto md:w-96 z-20 animate-in slide-in-from-bottom duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[70vh]">
                        <div className="h-28 relative p-5 flex flex-col justify-end" style={{ backgroundColor: buildingColor }}>
                             <button onClick={() => {setActiveBuilding(null); clearRoute();}} className="absolute top-3 right-3 bg-black/20 hover:bg-black/40 text-white p-1 rounded-full transition"><X size={18}/></button>
                             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                             <h2 className="text-white font-bold text-2xl relative z-10">{activeBuilding.name}</h2>
                             <span className="text-white/90 text-xs font-bold uppercase relative z-10">{activeBuilding.category}</span>
                        </div>

                        <div className="p-5 overflow-y-auto">
                            {activeBuilding.description && (
                                <div className="mb-5">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex gap-2 items-center"><Info size={14}/> Descripción</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{activeBuilding.description}</p>
                                </div>
                            )}

                            <div className="mb-5">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex gap-2 items-center"><Layers size={14}/> Directorio</h3>
                                {activeBuilding.rooms && activeBuilding.rooms.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeBuilding.rooms.map((room) => {
                                            const style = getRoomStyle(room.type);
                                            return (
                                                <div key={room.id} className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${style.color} transition-all hover:shadow-sm h-full`}>
                                                    <div className="mt-0.5 shrink-0">
                                                        {style.icon}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold leading-tight break-words whitespace-normal">
                                                            {room.name}
                                                        </span>
                                                        <span className="text-[10px] opacity-75 font-medium mt-1 block">
                                                            {formatFloor(room.floor)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No hay espacios registrados.</p>
                                )}
                            </div>

                            <button
                                onClick={handleNavigate}
                                className="w-full py-3 bg-guinda-600 hover:bg-guinda-700 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
                            >
                                <Navigation size={16}/>
                                {routeInfo ? 'Recalcular Ruta' : 'Navegar Aquí (Simulación)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BOTÓN GPS */}
            <button
                onClick={handleSimulateGPS}
                className="absolute bottom-6 right-4 bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-gray-100 dark:border-slate-700 text-blue-500 z-10 hover:bg-gray-50 active:scale-95 transition group"
                title="Simular estar en el Tec"
            >
                <Crosshair size={24} className={userLocation ? "animate-spin-slow text-guinda-600" : ""} />
            </button>

            {/* LEYENDA */}
            {!activeBuilding && (
                <div className="absolute bottom-10 left-4 z-10 md:left-auto md:bottom-28 md:right-12 pointer-events-none">
                    <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur p-3 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 min-w-[140px]">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 dark:border-slate-800 pb-1">Simbología</h3>
                        <div className="space-y-2">
                            {[
                                {label: 'Aulas', color: '#2563eb'},
                                {label: 'Labs', color: '#7c3aed'},
                                {label: 'Admin', color: '#1e293b'},
                                {label: 'Servicios', color: '#10b981'},
                                {label: 'Alimentos', color: '#f97316'}
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-md shadow-sm" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPage;