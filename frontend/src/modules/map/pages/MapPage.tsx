import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    Search, X, Navigation, Info, Layers, Crosshair,
    BookOpen, FlaskConical, Monitor, Utensils, FileText, Briefcase, Footprints, Clock,
    ChevronDown, ChevronUp, MapPinOff // Icono para fuera de zona
} from 'lucide-react';
import { useTheme } from '../../../shared/hooks/useTheme';
import { getBuildings, getBuildingById, searchMap } from '../../../shared/services/api';
import type { Building, MapSearchResult } from '../../../shared/types';

// --- CONFIGURACIÓN ---
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FsdmFhbGVqb3MiLCJhIjoiY21rZGZ4ZmUzMGJ6bzNmcTc5dW53MjZ5YiJ9.frpiERMPQTU5-TcKBHzP0Q';

const ITM_BOUNDS = [
    [-101.1950, 19.7150], // SW (Oeste, Sur)
    [-101.1750, 19.7300]  // NE (Este, Norte)
] as [number, number, number, number];

// --- AYUDANTES DE ESTILO ---
const getCategoryColor = (category: string) => {
    switch (category?.toUpperCase()) {
        case 'AULAS': return '#2563eb';
        case 'LABS': return '#7c3aed';
        case 'ADMINISTRATIVO': return '#1e293b';
        case 'SERVICIOS': return '#10b981';
        case 'ALIMENTOS': return '#f97316';
        case 'AREAS_VERDES': return '#65a30d';
        default: return '#64748b';
    }
};

const getRoomStyle = (type?: string) => {
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

const formatFloor = (floor: string) => floor === 'PB' ? 'Planta Baja' : `Piso ${floor}`;

// Función auxiliar para checar si estás en el Tec
const isInsideBounds = (lng: number, lat: number) => {
    const [swLng, swLat, neLng, neLat] = ITM_BOUNDS;
    return lng >= swLng && lng <= neLng && lat >= swLat && lat <= neLat;
};

const MapPage = () => {
    const { theme } = useTheme();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const watchIdRef = useRef<number | null>(null);

    // Datos
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [activeBuilding, setActiveBuilding] = useState<Building | null>(null);

    // UI State
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<MapSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false);

    // Alerta de "Fuera de zona"
    const [outOfZoneAlert, setOutOfZoneAlert] = useState(false);

    // GPS State
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{duration: number, distance: number} | null>(null);

    // --- 1. CARGAR MAPA ---
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
            try {
                const data = await getBuildings();
                setBuildings(data);
            } catch (error) {
                console.error("Error cargando edificios:", error);
            }
        });

        // Controles estándar de Mapbox (Zoom) - Esquina superior derecha, debajo de la búsqueda
        initMap.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
            initMap.remove();
            map.current = null;
        };
    }, []);

    // --- 2. RENDERIZAR MARCADORES ---
    useEffect(() => {
        if (!map.current || buildings.length === 0) return;
        renderMarkers();
    }, [buildings]);

    // --- TEMA ---
    useEffect(() => {
        if (!map.current) return;
        const style = theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
        map.current.setStyle(style);
        map.current.once('style.load', () => {
            renderMarkers();
            if (userLocation) updateUserMarker(userLocation);
        });
    }, [theme]);

    const renderMarkers = () => {
        if (!map.current) return;
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
                        background-color: ${color}; width: 36px; height: 36px; border-radius: 10px;
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 2px 10px ${color}60; transition: transform 0.2s;
                    " class="group-hover:-translate-y-1 group-hover:scale-110">
                        <span style="color: white; font-weight: 800; font-size: 13px;">${b.code || b.id}</span>
                    </div>
                    <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${color}; margin-top: -1px;"></div>
                </div>
            `;
            container.addEventListener('click', (e) => { e.stopPropagation(); handleBuildingSelect(b); });

            const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' })
                .setLngLat([b.coordinates.lng, b.coordinates.lat])
                .addTo(map.current!);
            markersRef.current.push(marker);
        });
    };

    // --- 3. SELECCIÓN ---
    const handleBuildingSelect = async (b: Partial<Building>) => {
        if (b.coordinates?.lng && b.coordinates?.lat && b.id) {
            const isMobile = window.innerWidth < 768;
            map.current?.flyTo({
                center: [b.coordinates.lng, b.coordinates.lat],
                zoom: 19,
                pitch: 60,
                offset: isMobile ? [0, -150] : [0, 0],
                duration: 1500
            });
            clearRoute();

            try {
                const detailedBuilding = await getBuildingById(b.id);
                setActiveBuilding(detailedBuilding);
            } catch {
                setActiveBuilding(b as Building);
            }
        }
    };

    // --- 4. BÚSQUEDA ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchText.length > 0) {
                setIsSearching(true);
                try {
                    const results = await searchMap(searchText);
                    setSearchResults(results);
                } catch (e) { console.error(e); } finally { setIsSearching(false); }
            } else { setSearchResults([]); }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText]);

    // --- 5. GPS REAL CON VALIDACIÓN DE ZONA ---
    const updateUserMarker = (coords: [number, number]) => {
        if (!map.current) return;
        if (userMarkerRef.current) userMarkerRef.current.remove();

        // Solo dibujamos el marcador si está dentro o cerca (opcional, aquí lo dibujamos siempre para referencia)
        const el = document.createElement('div');
        el.className = 'user-marker';
        el.innerHTML = `
            <span class="relative flex h-5 w-5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-500 border-2 border-white shadow-md"></span>
            </span>
        `;
        userMarkerRef.current = new mapboxgl.Marker(el).setLngLat(coords).addTo(map.current);
    };

    const handleRealGPS = () => {
        if (!navigator.geolocation) {
            alert("Tu navegador no soporta geolocalización");
            return;
        }

        setIsLocating(true);
        setOutOfZoneAlert(false);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setIsLocating(false);
                const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];

                // VALIDACIÓN: ¿ESTÁ DENTRO DEL TEC?
                if (isInsideBounds(coords[0], coords[1])) {
                    setUserLocation(coords);
                    updateUserMarker(coords);
                    map.current?.flyTo({ center: coords, zoom: 18, pitch: 0 });
                } else {
                    // Si está fuera, NO movemos el mapa y mostramos alerta
                    setOutOfZoneAlert(true);
                    // Ocultamos la alerta después de 3 segundos
                    setTimeout(() => setOutOfZoneAlert(false), 4000);
                }
            },
            (err) => {
                setIsLocating(false);
                console.error(err);
                if (err.code === 1) alert("Permiso de ubicación denegado.");
            },
            { enableHighAccuracy: true }
        );
    };

    // --- RUTA Y NAVEGACIÓN ---
    const getRoute = async (start: [number, number], end: [number, number]) => {
        if (!map.current) return;
        // Validación extra por si acaso
        if (!isInsideBounds(start[0], start[1])) {
            setOutOfZoneAlert(true);
            setTimeout(() => setOutOfZoneAlert(false), 4000);
            return;
        }

        try {
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

            const bounds = new mapboxgl.LngLatBounds();
            route.forEach((coord: number[]) => bounds.extend(coord as [number, number]));
            map.current.fitBounds(bounds, { padding: 50 });

        } catch (e) { console.error("Error ruta", e); }
    };

    const clearRoute = () => {
        if (map.current?.getLayer('route')) map.current.removeLayer('route');
        if (map.current?.getSource('route')) map.current.removeSource('route');
        setRouteInfo(null);
    };

    const handleNavigate = () => {
        if (!activeBuilding?.coordinates?.lat || !activeBuilding?.coordinates?.lng) return;
        const dest: [number, number] = [activeBuilding.coordinates.lng, activeBuilding.coordinates.lat];

        if (userLocation) {
            getRoute(userLocation, dest);
        } else {
            handleRealGPS();
        }
    };

    const buildingColor = activeBuilding ? getCategoryColor(activeBuilding.category) : '#2563eb';

    return (
        <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-gray-200 dark:bg-slate-900">
            {/* MAPA */}
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

            {/* TOAST: ALERTA FUERA DE ZONA */}
            {outOfZoneAlert && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <MapPinOff size={20} className="stroke-2"/>
                    <span className="font-bold text-sm">Lo sentimos, te encuentras fuera de la zona</span>
                </div>
            )}

            {/* INFO RUTA FLOTANTE */}
            {routeInfo && (
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-guinda-600 text-white px-5 py-2.5 rounded-full shadow-xl z-30 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-1.5"><Clock size={16} /><span className="font-bold text-sm">{routeInfo.duration} min</span></div>
                    <div className="w-px h-4 bg-white/30"></div>
                    <div className="flex items-center gap-1.5"><Footprints size={16} /><span className="font-bold text-sm">{routeInfo.distance} m</span></div>
                    <button onClick={clearRoute} className="ml-2 bg-white/20 rounded-full p-1 hover:bg-white/40"><X size={14}/></button>
                </div>
            )}

            {/* BUSCADOR */}
            <div className="absolute top-4 left-4 right-14 md:right-auto md:w-96 z-10">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-3 flex items-center gap-2">
                        <Search className="text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400"
                            value={searchText}
                            onChange={(e) => { setSearchText(e.target.value); if(e.target.value) setActiveBuilding(null); }}
                            onFocus={() => { if(isLegendOpen) setIsLegendOpen(false); }}
                        />
                        {searchText && <button onClick={() => setSearchText('')}><X size={16} className="text-gray-400" /></button>}
                    </div>
                    {/* RESULTADOS */}
                    {searchText && (
                        <div className="max-h-60 overflow-y-auto border-t border-gray-100 dark:border-slate-800">
                            {isSearching ? (
                                <div className="p-4 text-center text-xs text-gray-400">Buscando...</div>
                            ) : searchResults.length > 0 ? searchResults.map((result) => {
                                const isRoom = result.type === 'ROOM';
                                const roomStyle = isRoom ? getRoomStyle(result.category) : null;
                                const bColor = !isRoom ? getCategoryColor(result.detail) : '#ccc';
                                return (
                                    <div
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => {
                                            handleBuildingSelect({ id: result.building_id, coordinates: result.coordinates });
                                            setSearchText('');
                                        }}
                                        className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3 border-b border-gray-50 dark:border-slate-800"
                                    >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                                            style={!isRoom ? { backgroundColor: bColor } : {}} className={isRoom ? roomStyle?.color : ''}>
                                            {isRoom ? roomStyle?.icon : result.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <div className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{result.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{isRoom ? `📍 En ${result.detail}` : result.detail}</div>
                                        </div>
                                    </div>
                                );
                            }) : <div className="p-4 text-center text-xs text-gray-400">Sin resultados</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* BOTÓN GPS (REUBICADO: Esquina Inferior Derecha) */}
            {/* Se oculta si hay un edificio activo en móvil para no estorbar el panel */}
            {!activeBuilding && (
                <button
                    onClick={handleRealGPS}
                    className="absolute bottom-6 right-4 md:bottom-8 md:right-8 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 text-blue-500 z-10 hover:bg-gray-50 active:scale-95 transition"
                    title="Mi Ubicación"
                >
                    <Crosshair size={24} className={isLocating ? "animate-spin text-guinda-600" : (userLocation ? "text-blue-600 fill-current" : "")} />
                </button>
            )}

            {/* DETALLES DEL EDIFICIO */}
            {activeBuilding && (
                <div className="absolute bottom-0 inset-x-0 md:bottom-6 md:left-6 md:right-auto md:w-96 z-20 animate-in slide-in-from-bottom duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[60vh] md:max-h-[70vh]">
                        <div className="h-24 relative p-4 flex flex-col justify-end" style={{ backgroundColor: buildingColor }}>
                             <button onClick={() => {setActiveBuilding(null); clearRoute();}} className="absolute top-3 right-3 bg-black/20 hover:bg-black/40 text-white p-1 rounded-full"><X size={18}/></button>
                             <h2 className="text-white font-bold text-2xl relative z-10">{activeBuilding.name}</h2>
                             <span className="text-white/90 text-xs font-bold uppercase relative z-10">{activeBuilding.category}</span>
                        </div>
                        <div className="p-4 overflow-y-auto bg-white dark:bg-slate-900">
                            {activeBuilding.description && (
                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{activeBuilding.description}</p>
                            )}
                            <div className="mb-4">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Espacios</h3>
                                {activeBuilding.rooms && activeBuilding.rooms.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeBuilding.rooms.map((room) => {
                                            const style = getRoomStyle(room.type);
                                            return (
                                                <div key={room.id} className={`flex items-center gap-2 px-2 py-1.5 rounded border ${style.color}`}>
                                                    {style.icon}
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold truncate">{room.name}</span>
                                                        <span className="text-[9px] opacity-75">{formatFloor(room.floor)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <p className="text-xs text-gray-400 italic">Sin registros.</p>}
                            </div>
                            <button onClick={handleNavigate} className="w-full py-3 bg-guinda-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md">
                                <Navigation size={16}/> {routeInfo ? 'Recalcular' : 'Cómo llegar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEYENDA (SIMBOLOGÍA) - RESPONSIVE */}
            {!activeBuilding && (
                <div className={`absolute z-10 transition-all duration-300
                    ${isLegendOpen ? 'bottom-20 left-4 right-4' : 'bottom-6 left-4'}
                    md:bottom-8 md:left-8 md:right-auto
                `}>
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
                        <div
                            onClick={() => setIsLegendOpen(!isLegendOpen)}
                            className={`p-3 flex items-center justify-between cursor-pointer md:cursor-default ${isLegendOpen ? 'border-b border-gray-100 dark:border-slate-800' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                <Layers size={16} className="text-gray-500"/>
                                <span className={`text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${!isLegendOpen && 'hidden md:block'}`}>
                                    Simbología
                                </span>
                            </div>
                            <div className="md:hidden text-gray-400">
                                {isLegendOpen ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
                            </div>
                        </div>

                        <div className={`p-3 pt-2 space-y-2 ${!isLegendOpen ? 'hidden md:block' : 'block'}`}>
                            {[
                                {label: 'Aulas', color: '#2563eb'},
                                {label: 'Laboratorios', color: '#7c3aed'},
                                {label: 'Administrativo', color: '#1e293b'},
                                {label: 'Servicios', color: '#10b981'},
                                {label: 'Alimentos', color: '#f97316'}
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs text-gray-600 dark:text-gray-300">{item.label}</span>
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