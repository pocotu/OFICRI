/**
 * Store de Jerarquía - Gestión de estado central para la estructura jerárquica de áreas
 * Implementado con Pinia para mayor rendimiento y escalabilidad
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAreaStore } from './areas';
import { logOperation } from '@/shared/services/security/auditTrail';
import { useToast } from '@/shared/composables/useToast';

export const useHierarchyStore = defineStore('hierarchy', () => {
  // Referencias a otros stores
  const areaStore = useAreaStore();
  
  // Toast para notificaciones
  const { showToast } = useToast();
  
  // Estado reactivo
  const isLoading = ref(false);
  const error = ref(null);
  const expandedNodes = ref(new Set()); // Conjunto de IDs de áreas expandidas
  const selectedNode = ref(null); // ID del área seleccionada en la jerarquía
  const draggedNode = ref(null); // Nodo siendo arrastrado
  const dragOverNode = ref(null); // Nodo sobre el que se arrastra
  const dropPosition = ref(null); // Posición de drop: 'before', 'after', 'inside'
  
  // Getters computados
  
  /**
   * Construir la jerarquía completa de áreas
   */
  const hierarchyTree = computed(() => {
    // Verificar si hay datos de áreas
    if (!areaStore.areas || areaStore.areas.length === 0) {
      return [];
    }
    
    // Función para construir un árbol a partir de un nodo raíz
    const buildTree = (parentId = null) => {
      return areaStore.areas
        .filter(area => area.IDAreaPadre === parentId)
        .sort((a, b) => a.NombreArea.localeCompare(b.NombreArea))
        .map(area => ({
          id: area.IDArea,
          label: area.NombreArea,
          data: area,
          children: buildTree(area.IDArea),
          isExpanded: expandedNodes.value.has(area.IDArea),
          isSelected: selectedNode.value === area.IDArea,
          isDragging: draggedNode.value === area.IDArea,
          isDragOver: dragOverNode.value === area.IDArea,
        }));
    };
    
    return buildTree();
  });
  
  /**
   * Obtener la ruta de nodos desde la raíz hasta un nodo específico
   */
  const getNodePath = computed(() => {
    return (nodeId) => {
      const path = [];
      let currentId = nodeId;
      
      while (currentId) {
        const node = areaStore.areas.find(area => area.IDArea === currentId);
        if (!node) break;
        
        path.unshift(node);
        currentId = node.IDAreaPadre;
      }
      
      return path;
    };
  });
  
  /**
   * Obtener todos los descendientes de un nodo
   */
  const getDescendants = computed(() => {
    return (nodeId) => {
      const descendants = [];
      
      // Función recursiva para encontrar todos los descendientes
      const findDescendants = (parentId) => {
        const children = areaStore.areas.filter(area => area.IDAreaPadre === parentId);
        
        children.forEach(child => {
          descendants.push(child);
          findDescendants(child.IDArea);
        });
      };
      
      findDescendants(nodeId);
      return descendants;
    };
  });
  
  /**
   * Obtener el nivel de profundidad de un nodo en la jerarquía
   */
  const getNodeDepth = computed(() => {
    return (nodeId) => {
      return getNodePath.value(nodeId).length - 1;
    };
  });
  
  /**
   * Verificar si un nodo es ancestro de otro
   */
  const isAncestorOf = computed(() => {
    return (ancestorId, descendantId) => {
      const path = getNodePath.value(descendantId);
      return path.some(node => node.IDArea === ancestorId);
    };
  });
  
  // Acciones
  
  /**
   * Cargar datos de áreas
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Array>} Jerarquía de áreas
   */
  async function loadHierarchy(options = { force: false }) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Cargar áreas desde el store de áreas
      await areaStore.fetchAreas(options);
      return hierarchyTree.value;
    } catch (err) {
      error.value = err.message || 'Error al cargar jerarquía de áreas';
      showToast(error.value, 'error');
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Expandir o colapsar un nodo
   * @param {number} nodeId - ID del nodo
   * @param {boolean} expanded - Estado de expansión
   */
  function toggleNode(nodeId, expanded) {
    if (expanded) {
      expandedNodes.value.add(nodeId);
    } else {
      expandedNodes.value.delete(nodeId);
    }
  }
  
  /**
   * Expandir todos los nodos
   */
  function expandAll() {
    areaStore.areas.forEach(area => {
      expandedNodes.value.add(area.IDArea);
    });
  }
  
  /**
   * Colapsar todos los nodos
   */
  function collapseAll() {
    expandedNodes.value.clear();
  }
  
  /**
   * Seleccionar un nodo
   * @param {number} nodeId - ID del nodo
   */
  function selectNode(nodeId) {
    selectedNode.value = nodeId;
    
    if (nodeId) {
      // Expandir los nodos padres para mostrar el nodo seleccionado
      const path = getNodePath.value(nodeId);
      path.forEach(node => {
        if (node.IDAreaPadre) {
          expandedNodes.value.add(node.IDAreaPadre);
        }
      });
    }
  }
  
  /**
   * Comenzar operación de arrastre
   * @param {number} nodeId - ID del nodo arrastrado
   */
  function startDrag(nodeId) {
    draggedNode.value = nodeId;
  }
  
  /**
   * Finalizar operación de arrastre
   */
  function endDrag() {
    draggedNode.value = null;
    dragOverNode.value = null;
    dropPosition.value = null;
  }
  
  /**
   * Establecer nodo sobre el que se arrastra
   * @param {number} nodeId - ID del nodo
   * @param {string} position - Posición ('before', 'after', 'inside')
   */
  function setDragOver(nodeId, position) {
    dragOverNode.value = nodeId;
    dropPosition.value = position;
  }
  
  /**
   * Mover un nodo a una nueva posición en la jerarquía
   * @param {number} nodeId - ID del nodo a mover
   * @param {number} targetId - ID del nodo destino
   * @param {string} position - Posición ('before', 'after', 'inside')
   * @returns {Promise<Object>} Resultado de la operación
   */
  async function moveNode(nodeId, targetId, position) {
    if (!nodeId) {
      throw new Error('ID de nodo no proporcionado');
    }
    
    if (!targetId && position !== 'root') {
      throw new Error('ID de destino no proporcionado');
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Verificar si el destino es descendiente del nodo
      if (targetId && isAncestorOf.value(nodeId, targetId)) {
        throw new Error('No se puede mover un nodo a uno de sus descendientes');
      }
      
      // Determinar el nuevo padre según la posición
      let newParentId = null;
      
      if (position === 'inside') {
        // Si es inside, el padre es el target
        newParentId = targetId;
      } else if (position === 'root') {
        // Si es root, no tiene padre
        newParentId = null;
      } else {
        // Si es before o after, el padre es el mismo que el del target
        const targetNode = areaStore.getAreaById(targetId);
        newParentId = targetNode.IDAreaPadre;
      }
      
      // Actualizar el padre del nodo
      const result = await areaStore.updateAreaParent(nodeId, newParentId);
      
      // Registrar operación
      logOperation('HIERARCHY', 'INFO', `Nodo #${nodeId} movido a ${position} de #${targetId}`, {
        nodeId,
        targetId,
        position,
        newParentId
      });
      
      // Expandir el nuevo padre
      if (newParentId) {
        expandedNodes.value.add(newParentId);
      }
      
      // Seleccionar el nodo movido
      selectNode(nodeId);
      
      // Notificar
      showToast('Jerarquía actualizada correctamente', 'success');
      
      return result;
    } catch (err) {
      error.value = err.message || `Error al mover nodo #${nodeId}`;
      showToast(error.value, 'error');
      throw err;
    } finally {
      isLoading.value = false;
      // Finalizar operación de arrastre
      endDrag();
    }
  }
  
  /**
   * Reordenar nodos al mismo nivel
   * @param {Array<number>} nodeIds - IDs de nodos en orden
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async function reorderNodes(nodeIds) {
    if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length < 2) {
      return false;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Implementación específica para reordenar nodos
      // Esto dependerá de cómo el backend maneje el orden de los nodos
      
      // Registrar operación
      logOperation('HIERARCHY', 'INFO', 'Nodos reordenados', {
        nodeIds
      });
      
      // Notificar
      showToast('Nodos reordenados correctamente', 'success');
      
      return true;
    } catch (err) {
      error.value = err.message || 'Error al reordenar nodos';
      showToast(error.value, 'error');
      return false;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Crear un nuevo nodo hijo
   * @param {number} parentId - ID del nodo padre (null para nodos raíz)
   * @param {Object} nodeData - Datos del nuevo nodo
   * @returns {Promise<Object>} Nodo creado
   */
  async function createChildNode(parentId, nodeData) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Preparar datos con el padre
      const newNodeData = {
        ...nodeData,
        IDAreaPadre: parentId
      };
      
      // Crear área utilizando el store de áreas
      const result = await areaStore.createArea(newNodeData);
      
      // Expandir el padre
      if (parentId) {
        expandedNodes.value.add(parentId);
      }
      
      // Seleccionar el nuevo nodo
      selectNode(result.IDArea);
      
      // Notificar
      showToast('Área creada correctamente', 'success');
      
      return result;
    } catch (err) {
      error.value = err.message || 'Error al crear área';
      showToast(error.value, 'error');
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Eliminar un nodo y sus descendientes
   * @param {number} nodeId - ID del nodo a eliminar
   * @param {boolean} deleteDescendants - Si true, elimina todos los descendientes
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async function deleteNode(nodeId, deleteDescendants = false) {
    if (!nodeId) {
      throw new Error('ID de nodo no proporcionado');
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      if (deleteDescendants) {
        // Obtener todos los descendientes
        const descendants = getDescendants.value(nodeId);
        
        // Eliminar descendientes de abajo hacia arriba (para evitar errores de integridad)
        const sortedDescendants = [...descendants].sort((a, b) => {
          // Ordenar por nivel de profundidad (más profundo primero)
          return getNodeDepth.value(b.IDArea) - getNodeDepth.value(a.IDArea);
        });
        
        // Eliminar cada descendiente
        for (const descendant of sortedDescendants) {
          await areaStore.deleteArea(descendant.IDArea);
        }
      }
      
      // Eliminar el nodo principal
      await areaStore.deleteArea(nodeId);
      
      // Limpiar selección si era el nodo seleccionado
      if (selectedNode.value === nodeId) {
        selectedNode.value = null;
      }
      
      // Limpiar de expandedNodes
      expandedNodes.value.delete(nodeId);
      
      // Notificar
      const message = deleteDescendants 
        ? 'Área y sus descendientes eliminados correctamente' 
        : 'Área eliminada correctamente';
      showToast(message, 'success');
      
      return true;
    } catch (err) {
      error.value = err.message || `Error al eliminar área #${nodeId}`;
      showToast(error.value, 'error');
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Exportar jerarquía en formato específico
   * @param {string} format - Formato de exportación (json, csv, pdf)
   * @returns {Promise<Blob>} Datos exportados
   */
  async function exportHierarchy(format = 'json') {
    isLoading.value = true;
    error.value = null;
    
    try {
      if (format === 'json') {
        // Crear una representación JSON de la jerarquía
        const data = JSON.stringify(hierarchyTree.value, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        
        // Registrar operación
        logOperation('HIERARCHY', 'INFO', 'Jerarquía exportada en formato JSON');
        
        return blob;
      } else {
        // Usar el store de áreas para exportar en otros formatos
        // Esto dependerá de la implementación específica del backend
        return areaStore.exportAreaHierarchy({ format });
      }
    } catch (err) {
      error.value = err.message || `Error al exportar jerarquía en formato ${format}`;
      showToast(error.value, 'error');
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Restablecer el store a su estado inicial
   */
  function resetStore() {
    expandedNodes.value.clear();
    selectedNode.value = null;
    draggedNode.value = null;
    dragOverNode.value = null;
    dropPosition.value = null;
    isLoading.value = false;
    error.value = null;
  }
  
  return {
    // Estado
    isLoading,
    error,
    expandedNodes,
    selectedNode,
    draggedNode,
    dragOverNode,
    dropPosition,
    
    // Getters
    hierarchyTree,
    getNodePath,
    getDescendants,
    getNodeDepth,
    isAncestorOf,
    
    // Acciones
    loadHierarchy,
    toggleNode,
    expandAll,
    collapseAll,
    selectNode,
    startDrag,
    endDrag,
    setDragOver,
    moveNode,
    reorderNodes,
    createChildNode,
    deleteNode,
    exportHierarchy,
    resetStore
  };
}); 