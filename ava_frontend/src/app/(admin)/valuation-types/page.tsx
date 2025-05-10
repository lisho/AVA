// src/app/(admin)/valuation-types/page.tsx
'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios'; // Tu cliente API configurado
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    //DialogTrigger,
    DialogFooter,
    DialogDescription, // Opcional
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import axios from 'axios';
import { PlusCircle, Edit, Trash2, FileText, Loader2 } from 'lucide-react'; // Iconos
import { useRouter } from 'next/navigation'; // Para navegar al constructor de formularios
import { 
    Card, 
    //CardHeader, // Si los necesitas
    //CardTitle,  // Si los necesitas
    //CardContent // Si los necesitas
} from "@/components/ui/card";

// Esquema de validación para el formulario
const valuationTypeSchema = z.object({
    name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
    description: z.string().optional(),
    systemPrompt: z.string().min(10, { message: "El prompt de sistema es requerido y debe ser detallado." }),
    isActive: z.boolean(),
    
});

type ValuationTypeFormValues = z.infer<typeof valuationTypeSchema>;

// Interfaz para el tipo de dato que esperamos del backend
interface ValuationType {
    id: string;
    name: string;
    description?: string | null;
    systemPrompt: string;
    isActive: boolean;
    createdAt: string; // O Date si lo transformas
    updatedAt: string; // O Date
}

export default function ValuationTypesPage() {
    const router = useRouter();
    const [valuationTypes, setValuationTypes] = useState<ValuationType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingValuationType, setEditingValuationType] = useState<ValuationType | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Para el diálogo de confirmación de borrado
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [valuationTypeToDelete, setValuationTypeToDelete] = useState<ValuationType | null>(null);


    const form = useForm<ValuationTypeFormValues>({
        resolver: zodResolver(valuationTypeSchema),
        defaultValues: {
            name: '',
            description: '',
            systemPrompt: '',
            isActive: true,
        },
    });

    const fetchValuationTypes = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/admin/valuation-types');
            setValuationTypes(response.data);
        } catch (error) {
            console.error("Error al cargar tipos de valoración:", error);
            toast.error("No se pudieron cargar los tipos de valoración.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchValuationTypes();
    }, []);

    const handleEdit = (valuationType: ValuationType) => {
        setEditingValuationType(valuationType);
        form.reset({
            name: valuationType.name,
            description: valuationType.description || '',
            systemPrompt: valuationType.systemPrompt,
            isActive: valuationType.isActive,
        });
        setIsDialogOpen(true);
    };

    const handleCreateNew = () => {
        setEditingValuationType(null);
        form.reset({ name: '', description: '', systemPrompt: '', isActive: true });
        setIsDialogOpen(true);
    };

    const onSubmit: SubmitHandler<ValuationTypeFormValues> = async (data) => {
        setIsSubmitting(true);
        try {
            if (editingValuationType) {
                // Actualizar
                await apiClient.put(`/admin/valuation-types/${editingValuationType.id}`, data);
                toast.success(`"${data.name}" actualizado correctamente.`);
            } else {
                // Crear
                await apiClient.post('/admin/valuation-types', data);
                toast.success(`"${data.name}" creado correctamente.`);
            }
            setIsDialogOpen(false);
            fetchValuationTypes(); // Recargar la lista
        } catch (error) { // 'error' es 'unknown'
            let errorMessage = editingValuationType ? "Error al actualizar" : "Error al crear";
            if (axios.isAxiosError(error)) { // Type guard para AxiosError
                errorMessage = error.response?.data?.message || error.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(`${errorMessage}. Por favor, inténtelo de nuevo.`);
            console.error("Error al guardar tipo de valoración:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const openDeleteConfirm = (valuationType: ValuationType) => {
        setValuationTypeToDelete(valuationType);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!valuationTypeToDelete) return;
        setIsSubmitting(true); // Usar el mismo estado para el spinner del botón
        try {
            await apiClient.delete(`/admin/valuation-types/${valuationTypeToDelete.id}`);
            toast.success(`"${valuationTypeToDelete.name}" eliminado correctamente.`);
            setShowDeleteConfirm(false);
            setValuationTypeToDelete(null);
            fetchValuationTypes(); // Recargar la lista
        } catch (error) {
            let errorMessage = "Error al eliminar el tipo de valoración.";
            if (axios.isAxiosError(error)) { // Type guard
                errorMessage = error.response?.data?.message || error.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
            console.error("Error al eliminar:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const navigateToBuilder = (id: string) => {
        router.push(`/valuation-types/${id}/builder`);
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Cargando tipos de valoración...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Gestión de Tipos de Valoración</h1>
                <Button onClick={handleCreateNew}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingValuationType ? "Editar Tipo de Valoración" : "Crear Nuevo Tipo de Valoración"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" {...form.register('name')} className="mt-1" />
                            {form.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="description">Descripción (Opcional)</Label>
                            <Textarea id="description" {...form.register('description')} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="systemPrompt">Prompt de Sistema para IA</Label>
                            <Textarea
                                id="systemPrompt"
                                {...form.register('systemPrompt')}
                                className="mt-1 min-h-[150px]"
                                placeholder="Ej: Eres un asistente que evalúa la situación de exclusión social basado en los siguientes criterios..."
                            />
                            {form.formState.errors.systemPrompt && (
                                <p className="text-sm text-red-600 mt-1">{form.formState.errors.systemPrompt.message}</p>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="isActive" 
                                checked={form.watch('isActive')}
                                onCheckedChange={(checked) => form.setValue('isActive', Boolean(checked))}
                            />
                            <Label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Activo
                            </Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingValuationType ? "Guardar Cambios" : "Crear Tipo"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            {/* Diálogo de Confirmación de Borrado */}
             <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Eliminación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar el tipo de valoración &quot;{valuationTypeToDelete?.name}&quot;? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="w-[100px] text-center">Activo</TableHead>
                            <TableHead className="w-[200px] text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {valuationTypes.length > 0 ? (
                            valuationTypes.map((vt) => (
                                <TableRow key={vt.id}>
                                    <TableCell className="font-medium">{vt.name}</TableCell>
                                    <TableCell className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                        {vt.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {vt.isActive ? (
                                            <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full dark:bg-green-700 dark:text-green-100">Sí</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full dark:bg-red-700 dark:text-red-100">No</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="icon" title="Gestionar Formulario" onClick={() => navigateToBuilder(vt.id)}>
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" title="Editar" onClick={() => handleEdit(vt)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" title="Eliminar" onClick={() => openDeleteConfirm(vt)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                                    No hay tipos de valoración creados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}