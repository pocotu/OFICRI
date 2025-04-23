<template>
  <div class="document-viewer">
    <div class="viewer-toolbar">
      <div class="zoom-controls">
        <button @click="zoomOut" :disabled="scale <= 0.5">
          <i class="fas fa-search-minus"></i>
        </button>
        <span>{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn" :disabled="scale >= 2">
          <i class="fas fa-search-plus"></i>
        </button>
      </div>
      
      <div class="rotation-controls">
        <button @click="rotateLeft">
          <i class="fas fa-undo"></i>
        </button>
        <button @click="rotateRight">
          <i class="fas fa-redo"></i>
        </button>
      </div>
      
      <div class="page-controls" v-if="totalPages > 1">
        <button @click="prevPage" :disabled="currentPage === 1">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      
      <div class="search-controls">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Buscar texto..."
          @keyup.enter="searchText"
        >
        <button @click="searchText">
          <i class="fas fa-search"></i>
        </button>
        <span v-if="searchResults.length > 0">
          {{ currentResultIndex + 1 }} de {{ searchResults.length }}
        </span>
      </div>
    </div>
    
    <div 
      class="viewer-container"
      @wheel="handleWheel"
      @mousedown="startPan"
      @mousemove="pan"
      @mouseup="stopPan"
      @mouseleave="stopPan"
    >
      <div 
        class="document-content"
        :style="{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          cursor: isPanning ? 'grabbing' : 'grab'
        }"
      >
        <!-- PDF Viewer -->
        <iframe
          v-if="isPDF"
          ref="pdfViewer"
          :src="documentUrl"
          class="pdf-frame"
          @load="handlePDFLoad"
        ></iframe>
        
        <!-- Image Viewer -->
        <img
          v-else-if="isImage"
          :src="documentUrl"
          :alt="documentTitle"
          class="image-content"
          @load="handleImageLoad"
        >
        
        <!-- Text Viewer -->
        <pre
          v-else-if="isText"
          class="text-content"
          ref="textContent"
        >{{ textContent }}</pre>
        
        <!-- Unsupported Format -->
        <div v-else class="unsupported-format">
          Formato no soportado para visualización
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useDocumentStore } from '@/store/documents';
import { useAuthStore } from '@/store';
import { pdfService } from '../services/pdfService';

const props = defineProps({
  documentId: {
    type: [String, Number],
    required: true
  }
});

const documentStore = useDocumentStore();
const authStore = useAuthStore();

// Estado del visor
const scale = ref(1);
const rotation = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);
const searchQuery = ref('');
const searchResults = ref([]);
const currentResultIndex = ref(-1);
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });
const documentUrl = ref('');
const textContent = ref('');
const documentTitle = ref('');

// Referencias a elementos del DOM
const pdfViewer = ref(null);
const textContent = ref(null);

// Computed properties
const isPDF = computed(() => {
  return documentUrl.value?.toLowerCase().endsWith('.pdf');
});

const isImage = computed(() => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  return imageExtensions.some(ext => 
    documentUrl.value?.toLowerCase().endsWith(ext)
  );
});

const isText = computed(() => {
  const textExtensions = ['.txt', '.md', '.json', '.xml', '.html'];
  return textExtensions.some(ext => 
    documentUrl.value?.toLowerCase().endsWith(ext)
  );
});

// Métodos de zoom
const zoomIn = () => {
  if (scale.value < 2) {
    scale.value = Math.min(2, scale.value + 0.1);
    if (isPDF.value) {
      pdfService.setScale(scale.value);
      // Re-renderizar la página actual con la nueva escala
      const canvas = document.querySelector('canvas');
      if (canvas) {
        pdfService.getPage(currentPage.value).then(page => {
          pdfService.renderPage(page, canvas, scale.value, rotation.value);
        });
      }
    }
  }
};

const zoomOut = () => {
  if (scale.value > 0.5) {
    scale.value = Math.max(0.5, scale.value - 0.1);
    if (isPDF.value) {
      pdfService.setScale(scale.value);
      // Re-renderizar la página actual con la nueva escala
      const canvas = document.querySelector('canvas');
      if (canvas) {
        pdfService.getPage(currentPage.value).then(page => {
          pdfService.renderPage(page, canvas, scale.value, rotation.value);
        });
      }
    }
  }
};

const handleWheel = (event) => {
  if (event.ctrlKey) {
    event.preventDefault();
    if (event.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }
};

// Métodos de rotación
const rotateLeft = () => {
  rotation.value = (rotation.value - 90) % 360;
  if (isPDF.value) {
    pdfService.setRotation(rotation.value);
    // Re-renderizar la página actual con la nueva rotación
    const canvas = document.querySelector('canvas');
    if (canvas) {
      pdfService.getPage(currentPage.value).then(page => {
        pdfService.renderPage(page, canvas, scale.value, rotation.value);
      });
    }
  }
};

const rotateRight = () => {
  rotation.value = (rotation.value + 90) % 360;
  if (isPDF.value) {
    pdfService.setRotation(rotation.value);
    // Re-renderizar la página actual con la nueva rotación
    const canvas = document.querySelector('canvas');
    if (canvas) {
      pdfService.getPage(currentPage.value).then(page => {
        pdfService.renderPage(page, canvas, scale.value, rotation.value);
      });
    }
  }
};

// Métodos de navegación
const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    if (isPDF.value) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const page = await pdfService.getPage(currentPage.value);
        await pdfService.renderPage(page, canvas, scale.value, rotation.value);
      }
    }
  }
};

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    if (isPDF.value) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const page = await pdfService.getPage(currentPage.value);
        await pdfService.renderPage(page, canvas, scale.value, rotation.value);
      }
    }
  }
};

// Métodos de búsqueda
const searchText = async () => {
  if (!searchQuery.value) {
    searchResults.value = [];
    currentResultIndex.value = -1;
    return;
  }

  if (isPDF.value) {
    try {
      const matches = await pdfService.searchText(searchQuery.value, currentPage.value);
      searchResults.value = matches;
      if (matches.length > 0) {
        currentResultIndex.value = 0;
        // Implementar la lógica para resaltar y navegar a la coincidencia
      }
    } catch (error) {
      console.error('Error searching PDF:', error);
    }
  } else if (isText.value) {
    const content = textContent.value;
    const regex = new RegExp(searchQuery.value, 'gi');
    const matches = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      matches.push(match.index);
    }
    
    searchResults.value = matches;
    if (matches.length > 0) {
      currentResultIndex.value = 0;
      scrollToMatch(matches[0]);
    }
  }
};

const scrollToMatch = (index) => {
  if (isText.value && textContent.value) {
    const element = document.createElement('div');
    element.id = `search-result-${index}`;
    textContent.value.parentNode.appendChild(element);
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

// Métodos de pan (arrastrar)
const startPan = (event) => {
  isPanning.value = true;
  panStart.value = {
    x: event.clientX,
    y: event.clientY
  };
};

const pan = (event) => {
  if (!isPanning.value) return;
  
  const deltaX = event.clientX - panStart.value.x;
  const deltaY = event.clientY - panStart.value.y;
  
  const container = event.currentTarget;
  container.scrollLeft -= deltaX;
  container.scrollTop -= deltaY;
  
  panStart.value = {
    x: event.clientX,
    y: event.clientY
  };
};

const stopPan = () => {
  isPanning.value = false;
};

// Manejadores de carga
const handlePDFLoad = async () => {
  try {
    await pdfService.loadDocument(documentUrl.value);
    totalPages.value = pdfService.totalPages.value;
    
    // Configurar el canvas para el PDF
    const canvas = document.createElement('canvas');
    pdfViewer.value.parentNode.replaceChild(canvas, pdfViewer.value);
    
    // Renderizar la primera página
    const page = await pdfService.getPage(1);
    await pdfService.renderPage(page, canvas, scale.value, rotation.value);
  } catch (error) {
    console.error('Error loading PDF:', error);
  }
};

const handleImageLoad = () => {
  totalPages.value = 1;
};

// Inicialización
onMounted(async () => {
  try {
    const document = await documentStore.getDocument(props.documentId);
    documentUrl.value = document.url;
    documentTitle.value = document.title;
    
    if (isText.value) {
      const response = await fetch(documentUrl.value);
      textContent.value = await response.text();
    }
  } catch (error) {
    console.error('Error loading document:', error);
  }
});

// Limpieza
onUnmounted(() => {
  if (isPDF.value) {
    pdfService.cleanup();
  }
});
</script>

<style scoped>
.document-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f5f5;
}

.viewer-toolbar {
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  background-color: #fff;
  border-bottom: 1px solid #ddd;
}

.zoom-controls,
.rotation-controls,
.page-controls,
.search-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.viewer-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: #e0e0e0;
}

.document-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
  transition: transform 0.2s ease;
}

.pdf-frame,
.image-content,
.text-content {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.text-content {
  white-space: pre-wrap;
  font-family: monospace;
  padding: 1rem;
  background-color: #fff;
}

.unsupported-format {
  padding: 2rem;
  text-align: center;
  color: #666;
}

button {
  padding: 0.5rem;
  border: none;
  background-color: #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input[type="text"] {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}
</style> 