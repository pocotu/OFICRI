<template>
  <div class="configuracion-digitalizacion">
    <div class="header">
      <h2>Configuración de Digitalización</h2>
      <p>Configure los parámetros de digitalización de documentos</p>
    </div>

    <div class="form-container">
      <form @submit.prevent="guardarConfiguracion">
        <div class="form-section">
          <h3>Parámetros de Calidad</h3>
          
          <div class="form-group">
            <label for="resolucion">Resolución Mínima (DPI)</label>
            <input
              type="number"
              id="resolucion"
              v-model="configuracion.resolucionMinima"
              min="150"
              max="600"
              required
            />
            <span class="help-text">Valor recomendado: 300 DPI</span>
          </div>

          <div class="form-group">
            <label for="formato">Formato de Salida</label>
            <select id="formato" v-model="configuracion.formatoSalida" required>
              <option value="pdf">PDF</option>
              <option value="tiff">TIFF</option>
              <option value="jpeg">JPEG</option>
            </select>
          </div>

          <div class="form-group">
            <label for="compresion">Nivel de Compresión</label>
            <select id="compresion" v-model="configuracion.nivelCompresion" required>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h3>Procesamiento de Imágenes</h3>

          <div class="form-group">
            <label for="correccion">Corrección Automática</label>
            <div class="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  id="correccion"
                  v-model="configuracion.correccionAutomatica"
                />
                Habilitar corrección automática de imágenes
              </label>
            </div>
          </div>

          <div class="form-group" v-if="configuracion.correccionAutomatica">
            <label for="brillo">Ajuste de Brillo</label>
            <input
              type="range"
              id="brillo"
              v-model="configuracion.ajusteBrillo"
              min="0"
              max="100"
            />
            <span class="value-display">{{ configuracion.ajusteBrillo }}%</span>
          </div>

          <div class="form-group" v-if="configuracion.correccionAutomatica">
            <label for="contraste">Ajuste de Contraste</label>
            <input
              type="range"
              id="contraste"
              v-model="configuracion.ajusteContraste"
              min="0"
              max="100"
            />
            <span class="value-display">{{ configuracion.ajusteContraste }}%</span>
          </div>
        </div>

        <div class="form-section">
          <h3>OCR y Extracción de Texto</h3>

          <div class="form-group">
            <label for="ocr">Habilitar OCR</label>
            <div class="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  id="ocr"
                  v-model="configuracion.habilitarOCR"
                />
                Extraer texto de documentos escaneados
              </label>
            </div>
          </div>

          <div class="form-group" v-if="configuracion.habilitarOCR">
            <label for="idiomas">Idiomas OCR</label>
            <select
              id="idiomas"
              v-model="configuracion.idiomasOCR"
              multiple
              required
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="fr">Francés</option>
              <option value="pt">Portugués</option>
            </select>
            <span class="help-text">Mantenga presionado Ctrl para seleccionar múltiples idiomas</span>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="restaurarValores"
          >
            Restaurar Valores
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading"
          >
            <span v-if="loading">Guardando...</span>
            <span v-else>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import digitalizacionService from '@/services/mesa-partes/digitalizacionService';

const configuracion = ref({
  resolucionMinima: 300,
  formatoSalida: 'pdf',
  nivelCompresion: 'medio',
  correccionAutomatica: true,
  ajusteBrillo: 50,
  ajusteContraste: 50,
  habilitarOCR: true,
  idiomasOCR: ['es']
});

const loading = ref(false);
const configuracionOriginal = ref(null);

const cargarConfiguracion = async () => {
  try {
    loading.value = true;
    const data = await digitalizacionService.getConfiguracion();
    configuracion.value = data;
    configuracionOriginal.value = { ...data };
  } catch (error) {
    console.error('Error al cargar configuración:', error);
    // Mostrar mensaje de error al usuario
  } finally {
    loading.value = false;
  }
};

const guardarConfiguracion = async () => {
  try {
    loading.value = true;
    await digitalizacionService.actualizarConfiguracion(configuracion.value);
    // Mostrar mensaje de éxito
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    // Mostrar mensaje de error al usuario
  } finally {
    loading.value = false;
  }
};

const restaurarValores = () => {
  if (configuracionOriginal.value) {
    configuracion.value = { ...configuracionOriginal.value };
  }
};

onMounted(() => {
  cargarConfiguracion();
});
</script>

<style scoped>
.configuracion-digitalizacion {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
  text-align: center;
}

.header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.header p {
  color: #666;
}

.form-section {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

input[type="number"],
input[type="range"],
select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input[type="range"] {
  padding: 0;
}

.value-display {
  display: inline-block;
  margin-left: 1rem;
  color: #666;
}

.checkbox-group {
  margin-top: 0.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
}

.help-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #666;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
  border: 1px solid #bdc3c7;
}

.btn-secondary:hover {
  background-color: #dde4e6;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .configuracion-digitalizacion {
    padding: 1rem;
  }

  .form-section {
    padding: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style> 