<template>
  <div class="user-list">
    <!-- Filtros -->
    <div class="filters-section">
      <OfiInput
        v-model="filters.search"
        placeholder="Buscar por CIP o nombre"
        @input="debouncedSearch"
      />
      
      <OfiSelect
        v-model="filters.area"
        :options="areas"
        placeholder="Filtrar por área"
        @change="applyFilters"
      />
      
      <OfiSelect
        v-model="filters.role"
        :options="roles"
        placeholder="Filtrar por rol"
        @change="applyFilters"
      />
      
      <OfiSelect
        v-model="filters.status"
        :options="statusOptions"
        placeholder="Filtrar por estado"
        @change="applyFilters"
      />
      
      <OfiDateRange
        v-model:start="filters.dateFrom"
        v-model:end="filters.dateTo"
        @change="applyFilters"
      />
      
      <OfiButton @click="resetFilters">
        Limpiar filtros
      </OfiButton>
      
      <OfiButton @click="exportUsers" :loading="exporting">
        Exportar
      </OfiButton>
    </div>

    <!-- Tabla de usuarios -->
    <OfiTable
      :items="users"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      @sort="handleSort"
      @page-change="handlePageChange"
    >
      <template #cell-status="{ item }">
        <OfiBadge :type="item.Bloqueado ? 'danger' : 'success'">
          {{ item.Bloqueado ? 'Bloqueado' : 'Activo' }}
        </OfiBadge>
      </template>

      <template #cell-actions="{ item }">
        <div class="actions">
          <OfiButton
            v-if="hasPermission(128)"
            size="sm"
            @click="toggleUserStatus(item.IDUsuario)"
          >
            {{ item.Bloqueado ? 'Desbloquear' : 'Bloquear' }}
          </OfiButton>
          
          <OfiButton
            v-if="hasPermission(2)"
            size="sm"
            @click="changeUserArea(item.IDUsuario)"
          >
            Cambiar área
          </OfiButton>
          
          <OfiButton
            v-if="hasPermission(128)"
            size="sm"
            @click="changeUserRole(item.IDUsuario)"
          >
            Cambiar rol
          </OfiButton>
        </div>
      </template>
    </OfiTable>

    <!-- Indicadores -->
    <div class="indicators">
      <OfiCard title="Estadísticas">
        <div class="stats">
          <div class="stat">
            <span class="label">Total usuarios:</span>
            <span class="value">{{ pagination.total }}</span>
          </div>
          <div class="stat">
            <span class="label">Activos:</span>
            <span class="value">{{ activeUsers }}</span>
          </div>
          <div class="stat">
            <span class="label">Bloqueados:</span>
            <span class="value">{{ blockedUsers }}</span>
          </div>
        </div>
      </OfiCard>
    </div>
  </div>

  <ChangeAreaModal
    v-model="showAreaModal"
    :user="selectedUser"
    @success="handleAreaChangeSuccess"
  />

  <ChangeRoleModal
    v-model="showRoleModal"
    :user="selectedUser"
    @success="handleRoleChangeSuccess"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../../store/userStore';
import { usePermissionStore } from '@shared/store/permissionStore';
import { debounce } from '@shared/utils/helpers';
import OfiTable from '@shared/components/OfiTable/OfiTable.vue';
import OfiInput from '@shared/components/OfiInput/OfiInput.vue';
import OfiSelect from '@shared/components/OfiSelect/OfiSelect.vue';
import OfiButton from '@shared/components/OfiButton/OfiButton.vue';
import OfiBadge from '@shared/components/OfiBadge/OfiBadge.vue';
import OfiCard from '@shared/components/OfiCard/OfiCard.vue';
import OfiDateRange from '@shared/components/OfiDateRange/OfiDateRange.vue';
import ChangeAreaModal from './ChangeAreaModal.vue';
import ChangeRoleModal from './ChangeRoleModal.vue';

const userStore = useUserStore();
const permissionStore = usePermissionStore();

const columns = [
  { key: 'CodigoCIP', label: 'CIP', sortable: true },
  { key: 'Nombres', label: 'Nombres', sortable: true },
  { key: 'Apellidos', label: 'Apellidos', sortable: true },
  { key: 'Grado', label: 'Grado', sortable: true },
  { key: 'NombreArea', label: 'Área', sortable: true },
  { key: 'NombreRol', label: 'Rol', sortable: true },
  { key: 'UltimoAcceso', label: 'Último acceso', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'actions', label: 'Acciones' }
];

const filters = ref({
  search: '',
  area: null,
  role: null,
  status: null,
  dateFrom: null,
  dateTo: null
});

const exporting = ref(false);

const users = computed(() => userStore.users);
const loading = computed(() => userStore.loading);
const pagination = computed(() => userStore.pagination);

const activeUsers = computed(() => 
  userStore.users.filter(user => !user.Bloqueado).length
);

const blockedUsers = computed(() => 
  userStore.users.filter(user => user.Bloqueado).length
);

const debouncedSearch = debounce(() => {
  userStore.searchUsers();
}, 300);

const handleSort = (field) => {
  userStore.changeSort(field);
};

const handlePageChange = (page) => {
  userStore.changePage(page);
};

const applyFilters = () => {
  userStore.applyFilters(filters.value);
};

const resetFilters = () => {
  userStore.resetFilters();
};

const exportUsers = async () => {
  exporting.value = true;
  try {
    await userStore.exportUsers();
  } finally {
    exporting.value = false;
  }
};

const toggleUserStatus = async (id) => {
  await userStore.toggleUserStatus(id);
};

const showAreaModal = ref(false);
const showRoleModal = ref(false);
const selectedUser = ref(null);

const changeUserArea = async (id) => {
  selectedUser.value = userStore.users.find(user => user.IDUsuario === id);
  showAreaModal.value = true;
};

const changeUserRole = async (id) => {
  selectedUser.value = userStore.users.find(user => user.IDUsuario === id);
  showRoleModal.value = true;
};

const handleAreaChangeSuccess = () => {
  userStore.fetchUsers();
};

const handleRoleChangeSuccess = () => {
  userStore.fetchUsers();
};

const hasPermission = (permission) => {
  return permissionStore.hasPermission(permission);
};

onMounted(() => {
  userStore.fetchUsers();
});
</script>

<style scoped>
.user-list {
  padding: 1rem;
}

.filters-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.indicators {
  margin-top: 1rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat .label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat .value {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-primary);
}
</style> 