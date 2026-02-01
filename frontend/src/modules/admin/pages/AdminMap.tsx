import { useEffect, useState } from 'react';
import {
    Plus, Edit2, Trash2, Search,
    Building as BuildingIcon, Layers, MapPin
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
    getBuildings, getBuildingById, createBuilding, updateBuilding, deleteBuilding,
    createRoom, updateRoom, deleteRoom
} from '../../../shared/services/api';
import type { Building, Room } from '../../../shared/types';

// 👇 Importamos nuestros componentes modulares
import { BuildingModal } from '../components/BuildingModal';
import { RoomModal } from '../components/RoomModal';

export const AdminMap = () => {
    // --- ESTADOS ---
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Selección
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

    // Modales
    const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
    const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);

    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);

    // --- CARGA INICIAL ---
    useEffect(() => {
        loadBuildings();
    }, []);

    const loadBuildings = async () => {
        setLoading(true);
        try {
            const data = await getBuildings();
            setBuildings(data);
        } catch (error) {
            console.error("Error cargando edificios:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE EDIFICIOS ---

    const handleCreateBuilding = () => {
        setEditingBuilding(null); // Null = Nuevo
        setIsBuildingModalOpen(true);
    };

    const handleEditBuilding = (b: Building) => {
        setEditingBuilding(b);
        setIsBuildingModalOpen(true);
    };

    const handleSaveBuilding = async (data: Partial<Building>) => {
        try {
            // Aseguramos que coordinates tenga valores por defecto si vienen vacíos
            const payload = {
                ...data,
                coordinates: data.coordinates || { lat: 0, lng: 0 }
            };

            if (editingBuilding) {
                await updateBuilding(editingBuilding.id, payload);
                Swal.fire('Actualizado', 'Edificio actualizado correctamente', 'success');
            } else {
                await createBuilding(payload);
                Swal.fire('Creado', 'Edificio creado correctamente', 'success');
            }
            loadBuildings(); // Recargar lista
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo guardar el edificio', 'error');
            throw error; // Para que el modal sepa que falló
        }
    };

    const handleDeleteBuilding = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar Edificio?',
            text: "Se eliminarán también todos sus salones y coordenadas.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteBuilding(id);
                if (selectedBuilding?.id === id) setSelectedBuilding(null);
                loadBuildings();
                Swal.fire('Eliminado', 'El edificio ha sido eliminado.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el edificio.', 'error');
            }
        }
    };

    const handleSelectBuilding = async (b: Building) => {
        // Al seleccionar, cargamos el detalle completo (incluyendo rooms) de la API
        try {
            const detailed = await getBuildingById(b.id);
            setSelectedBuilding(detailed);
        } catch (error) {
            console.error("Error cargando detalle:", error);
            // Fallback por si falla la API individual
            setSelectedBuilding(b);
        }
    };


    // --- LÓGICA DE SALONES ---

    const handleCreateRoom = () => {
        if (!selectedBuilding) return;
        setEditingRoom(null);
        setIsRoomModalOpen(true);
    };

    const handleEditRoom = (r: Room) => {
        setEditingRoom(r);
        setIsRoomModalOpen(true);
    };

    const handleSaveRoom = async (data: Partial<Room>) => {
        try {
            if (editingRoom) {
                await updateRoom(editingRoom.id, data);
            } else {
                await createRoom(data);
            }

            // Recargar solo el edificio seleccionado para ver el nuevo salón
            if (selectedBuilding) {
                const updated = await getBuildingById(selectedBuilding.id);
                setSelectedBuilding(updated);
            }
            Swal.fire('Guardado', 'Espacio guardado correctamente', 'success');
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo guardar el espacio', 'error');
            throw error;
        }
    };

    const handleDeleteRoom = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar Espacio?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await deleteRoom(id);
                if (selectedBuilding) {
                    const updated = await getBuildingById(selectedBuilding.id);
                    setSelectedBuilding(updated);
                }
                Swal.fire('Eliminado', '', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    };


    // Filtrado
    const filteredBuildings = buildings.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="text-guinda-600" /> Gestión de Mapa
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Administra la infraestructura del campus.</p>
                </div>
                <button
                    onClick={handleCreateBuilding}
                    className="flex items-center gap-2 bg-guinda-600 hover:bg-guinda-700 text-white px-4 py-2.5 rounded-xl transition-colors font-bold text-sm shadow-sm hover:shadow-md active:scale-95"
                >
                    <Plus size={18} /> Nuevo Edificio
                </button>
            </div>

            {/* BUSCADOR */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-guinda-500 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Buscar edificio por nombre, código o categoría..."
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all dark:text-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* COLUMNA IZQUIERDA: LISTA DE EDIFICIOS (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    <h2 className="font-bold text-gray-400 text-xs uppercase tracking-wider px-1">Directorios de Edificios</h2>

                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Cargando mapa...</div>
                    ) : filteredBuildings.length > 0 ? (
                        <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                            {filteredBuildings.map(building => (
                                <div
                                    key={building.id}
                                    onClick={() => handleSelectBuilding(building)}
                                    className={`
                                        group relative p-4 border rounded-xl cursor-pointer transition-all duration-200
                                        ${selectedBuilding?.id === building.id 
                                            ? 'bg-guinda-50 border-guinda-200 dark:bg-guinda-900/10 dark:border-guinda-900 shadow-md transform scale-[1.02]' 
                                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors
                                                ${selectedBuilding?.id === building.id 
                                                    ? 'bg-guinda-600 text-white shadow-sm' 
                                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-700'
                                                }
                                            `}>
                                                {building.code}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-white truncate">{building.name}</h3>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
                                                    {building.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Botones de acción (visibles al hover o si está seleccionado) */}
                                        <div className={`flex gap-1 ${selectedBuilding?.id === building.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditBuilding(building); }}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteBuilding(building.id); }}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                            <p className="text-gray-400 text-sm">No se encontraron edificios.</p>
                        </div>
                    )}
                </div>

                {/* COLUMNA DERECHA: DETALLES Y SALONES (8 cols) */}
                <div className="lg:col-span-8">
                    {selectedBuilding ? (
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full animate-in slide-in-from-right-4 duration-300">

                            {/* Header del Panel Derecho */}
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {selectedBuilding.name}
                                        <span className="text-sm font-normal text-gray-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                                            {selectedBuilding.code}
                                        </span>
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1 max-w-md truncate">
                                        {selectedBuilding.description || "Sin descripción"}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCreateRoom}
                                    className="flex items-center gap-2 text-sm bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 shadow-sm transition-all active:scale-95 font-medium"
                                >
                                    <Plus size={16} /> Agregar Espacio
                                </button>
                            </div>

                            {/* Tabla de Salones */}
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 uppercase text-xs border-b border-gray-100 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Identificador</th>
                                            <th className="px-6 py-4 font-bold">Ubicación</th>
                                            <th className="px-6 py-4 font-bold">Tipo</th>
                                            <th className="px-6 py-4 font-bold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                        {selectedBuilding.rooms && selectedBuilding.rooms.length > 0 ? (
                                            selectedBuilding.rooms.map(room => (
                                                <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                    <td className="px-6 py-3 font-bold text-gray-800 dark:text-gray-200">
                                                        {room.name}
                                                    </td>
                                                    <td className="px-6 py-3 text-gray-500">
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-xs">
                                                            <Layers size={12}/> {room.floor === 'PB' ? 'Planta Baja' : `Piso ${room.floor}`}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className={`
                                                            text-xs font-bold px-2 py-1 rounded-full border
                                                            ${room.type === 'CLASSROOM' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900' : ''}
                                                            ${room.type === 'LAB' ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:border-purple-900' : ''}
                                                            ${!['CLASSROOM', 'LAB'].includes(room.type) ? 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-400' : ''}
                                                        `}>
                                                            {room.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditRoom(room)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRoom(room.id)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Layers size={32} className="opacity-20" />
                                                        <p>Este edificio aún no tiene espacios registrados.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-gray-50 dark:bg-slate-800/50 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4">
                                <BuildingIcon size={32} className="text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Selecciona un Edificio</h3>
                            <p className="text-gray-500 max-w-sm mt-2">
                                Haz clic en un edificio de la lista izquierda para ver sus detalles, gestionar sus salones y coordenadas.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALES --- */}

            <BuildingModal
                isOpen={isBuildingModalOpen}
                onClose={() => setIsBuildingModalOpen(false)}
                onSave={handleSaveBuilding}
                initialData={editingBuilding}
            />

            {selectedBuilding && (
                <RoomModal
                    isOpen={isRoomModalOpen}
                    onClose={() => setIsRoomModalOpen(false)}
                    onSave={handleSaveRoom}
                    initialData={editingRoom}
                    buildingId={selectedBuilding.id}
                />
            )}
        </div>
    );
};

export default AdminMap;