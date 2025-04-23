import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import mesaPartesService from '@/services/mesa-partes/mesaPartesService';
import { useAuthStore } from './auth';

export const useMesaPartesStore = defineStore('mesaPartes', () => {
  const authStore = useAuthStore();
  
  // Estado
  const mesasPartes = ref([]);
  const recepciones = ref([]);
  const pendientes = ref([]);
  const estadisticas = ref({});
  const loading = ref(false);
  const error = ref(null);
  
  // Filtros
  const filters = ref({
    search: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
    idArea: '',
    tipoDocumento: '',
    prioridad: ''
  });
  
  // Paginación
  const pagination = ref({
    page: 1,
    limit: 10,
    sort: 'id',
    order: 'asc',
    total: 0
  });

  // Permisos
  const PERMISSION_BITS = {
    CREAR: 1,
    EDITAR: 2,
    ELIMINAR: 4,
    VER: 8,
    DERIVAR: 16,
    AUDITAR: 32,
    EXPORTAR: 64,
    ADMINISTRAR: 128
  };

  // Computed
  const hasPermission = (bit) => {
    return (authStore.user?.Permisos & bit) === bit;
  };

  const canCreate = computed(() => hasPermission(PERMISSION_BITS.CREAR));
  const canEdit = computed(() => hasPermission(PERMISSION_BITS.EDITAR));
  const canDelete = computed(() => hasPermission(PERMISSION_BITS.ELIMINAR));
  const canView = computed(() => hasPermission(PERMISSION_BITS.VER));
  const canDerive = computed(() => hasPermission(PERMISSION_BITS.DERIVAR));
  const canAudit = computed(() => hasPermission(PERMISSION_BITS.AUDITAR));
  const canExport = computed(() => hasPermission(PERMISSION_BITS.EXPORTAR));
  const canAdminister = computed(() => hasPermission(PERMISSION_BITS.ADMINISTRAR));

  // Acciones
  const fetchMesasPartes = async () => {
    if (!canView.value) {
      error.value = 'No tiene permisos para ver mesas de partes';
      return;
    }

    try {
      loading.value = true;
      const response = await mesaPartesService.getMesasPartes(filters.value, pagination.value);
      mesasPartes.value = response.data;
      pagination.value.total = response.meta.total;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const fetchRecepciones = async () => {
    if (!canView.value) {
      error.value = 'No tiene permisos para ver recepciones';
      return;
    }

    try {
      loading.value = true;
      const response = await mesaPartesService.getRecepciones(filters.value, pagination.value);
      recepciones.value = response.data;
      pagination.value.total = response.meta.total;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const fetchPendientes = async () => {
    if (!canView.value) {
      error.value = 'No tiene permisos para ver documentos pendientes';
      return;
    }

    try {
      loading.value = true;
      const response = await mesaPartesService.getPendientes(filters.value, pagination.value);
      pendientes.value = response.data;
      pagination.value.total = response.meta.total;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const fetchEstadisticas = async () => {
    if (!canView.value) {
      error.value = 'No tiene permisos para ver estadísticas';
      return;
    }

    try {
      loading.value = true;
      const response = await mesaPartesService.getEstadisticas(filters.value);
      estadisticas.value = response.data;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const registrarRecepcion = async (recepcionData) => {
    if (!canCreate.value) {
      error.value = 'No tiene permisos para registrar recepciones';
      return;
    }

    try {
      loading.value = true;
      const response = await mesaPartesService.registrarRecepcion(recepcionData);
      await fetchRecepciones();
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const derivarDocumento = async (documentoId, derivacionData) => {
    if (!canDerive.value) {
      error.value = 'No tiene permisos para derivar documentos';
      return;
    }

    try {
      loading.value = true;
      const response = await mesaPartesService.derivarDocumento(documentoId, derivacionData);
      await fetchPendientes();
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const exportarDocumentos = async (formato = 'excel') => {
    if (!canExport.value) {
      error.value = 'No tiene permisos para exportar documentos';
      return;
    }

    try {
      loading.value = true;
      const response = await mesaPartesService.exportarDocumentos(filters.value, formato);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters };
    pagination.value.page = 1; // Resetear a primera página
  };

  const updatePagination = (newPagination) => {
    pagination.value = { ...pagination.value, ...newPagination };
  };

  const clearFilters = () => {
    filters.value = {
      search: '',
      estado: '',
      fechaDesde: '',
      fechaHasta: '',
      idArea: '',
      tipoDocumento: '',
      prioridad: ''
    };
    pagination.value.page = 1;
  };

  return {
    // Estado
    mesasPartes,
    recepciones,
    pendientes,
    estadisticas,
    loading,
    error,
    filters,
    pagination,

    // Permisos
    canCreate,
    canEdit,
    canDelete,
    canView,
    canDerive,
    canAudit,
    canExport,
    canAdminister,

    // Acciones
    fetchMesasPartes,
    fetchRecepciones,
    fetchPendientes,
    fetchEstadisticas,
    registrarRecepcion,
    derivarDocumento,
    exportarDocumentos,
    updateFilters,
    updatePagination,
    clearFilters
  };
}); 