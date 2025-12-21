import { Store, Heart, Utensils, Smartphone, GraduationCap, Ticket, Dumbbell, ShoppingBag } from 'lucide-react';

export const CATEGORIAS_CONVENIOS = [
    {
        id: 'SALUD',
        label: 'Salud y Bienestar',
        icon: Heart,
        color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20'
    },
    {
        id: 'COMIDA',
        label: 'Alimentos y Bebidas',
        icon: Utensils,
        color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20'
    },
    {
        id: 'TECNOLOGIA', // 👈 Estandarizado (antes era Electrónica/Tecnología)
        label: 'Tecnología y Accesorios',
        icon: Smartphone,
        color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
    },
    {
        id: 'EDUCACION',
        label: 'Educación y Cursos',
        icon: GraduationCap,
        color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
    },
    {
        id: 'ENTRETENIMIENTO',
        label: 'Ocio y Diversión',
        icon: Ticket,
        color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
        id: 'DEPORTE',
        label: 'Deporte y Fitness',
        icon: Dumbbell,
        color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
        id: 'VARIOS',
        label: 'Productos Varios',
        icon: ShoppingBag,
        color: 'text-gray-500 bg-gray-50 dark:bg-gray-800'
    },
];

// Helper para obtener etiqueta legible
export const getConvenioCategoryLabel = (id: string) => {
    const found = CATEGORIAS_CONVENIOS.find(c => c.id === id);
    return found ? found.label : id;
};