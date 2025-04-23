import { defineStore } from 'pinia';
import { userService } from '../services/userService';

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [],
    currentUser: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    },
    filters: {
      search: '',
      area: null,
      role: null,
      status: null,
      dateFrom: null,
      dateTo: null
    },
    sort: {
      field: 'IDUsuario',
      order: 'asc'
    }
  }),

  getters: {
    filteredUsers: (state) => state.users,
    hasMorePages: (state) => state.pagination.page < state.pagination.pages
  },

  actions: {
    async fetchUsers(params = {}) {
      this.loading = true;
      try {
        const response = await userService.getUsers({
          ...this.filters,
          ...this.sort,
          ...params
        });
        
        this.users = response.data.data;
        this.pagination = response.data.meta;
        this.error = null;
      } catch (error) {
        this.error = error.message;
        console.error('Error fetching users:', error);
      } finally {
        this.loading = false;
      }
    },

    async searchUsers() {
      await this.fetchUsers({ page: 1 });
    },

    async changePage(page) {
      await this.fetchUsers({ page });
    },

    async changeSort(field) {
      this.sort = {
        field,
        order: this.sort.field === field && this.sort.order === 'asc' ? 'desc' : 'asc'
      };
      await this.fetchUsers({ page: 1 });
    },

    async applyFilters(filters) {
      this.filters = { ...this.filters, ...filters };
      await this.fetchUsers({ page: 1 });
    },

    async resetFilters() {
      this.filters = {
        search: '',
        area: null,
        role: null,
        status: null,
        dateFrom: null,
        dateTo: null
      };
      await this.fetchUsers({ page: 1 });
    },

    async exportUsers() {
      try {
        const response = await userService.exportUsers(this.filters);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `usuarios_${new Date().toISOString()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        this.error = error.message;
        console.error('Error exporting users:', error);
      }
    },

    async toggleUserStatus(id) {
      try {
        await userService.toggleUserStatus(id);
        await this.fetchUsers();
      } catch (error) {
        this.error = error.message;
        console.error('Error toggling user status:', error);
      }
    },

    async changeUserArea(id, areaId) {
      try {
        await userService.changeUserArea(id, areaId);
        await this.fetchUsers();
      } catch (error) {
        this.error = error.message;
        console.error('Error changing user area:', error);
      }
    },

    async changeUserRole(id, roleId) {
      try {
        await userService.changeUserRole(id, roleId);
        await this.fetchUsers();
      } catch (error) {
        this.error = error.message;
        console.error('Error changing user role:', error);
      }
    }
  }
}); 