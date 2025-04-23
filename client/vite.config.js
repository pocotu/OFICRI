import { defineConfig, searchForWorkspaceRoot } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import federation from '@originjs/vite-plugin-federation';
import { resolve } from 'path';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  // Puerto único para todo el frontend
  const FRONTEND_PORT = 3001;
  
  // Obtener el módulo a construir de los argumentos
  const moduleArg = process.argv.find(arg => arg.includes('client/'))?.split('client/')[1];
  const module = moduleArg?.replace(/\/$/, '') || '';
  const isDevServer = command === 'serve';
  
  // Configuración de exposes para cada módulo
  const moduleExposes = {
    'auth': {
      './AuthService': './auth/src/services/authService.js',
      './Login': './auth/src/components/Login.vue',
      './Register': './auth/src/components/Register.vue',
    },
    'documents': {
      './DocumentViewer': './documents/src/components/DocumentViewer.vue',
      './DocumentsList': './documents/src/components/DocumentsList.vue',
    },
    'mesa-partes': {
      './MesaPartes': './mesa-partes/src/components/MesaPartes.vue',
    },
    'users': {
      './UserProfile': './users/src/components/UserProfile.vue',
      './UserList': './users/src/components/UserList.vue',
    },
    'dashboard': {
      './Dashboard': './dashboard/src/components/Dashboard.vue',
      './Stats': './dashboard/src/components/Stats.vue',
    },
    'areas': {
      './AreasModule': './areas/src/AreasModule.vue',
      './AreasService': './areas/src/services/areasService.js',
      './ResponsibleService': './areas/src/services/responsibleService.js',
    },
    'security': {
      './SecurityModule': './security/src/SecurityModule.vue',
    },
    'shared': {
      './utils': './shared/src/utils/index.js',
      './components/BaseButton': './shared/src/components/BaseButton.vue',
      './components/BaseInput': './shared/src/components/BaseInput.vue',
      './components/BaseCard': './shared/src/components/BaseCard.vue',
      './api': './shared/src/api/index.js',
      './services/auth/authService': './shared/src/services/auth/authService.js',
      './services/permissions/permissionService': './shared/src/services/permissions/permissionService.js',
      './services/security/auditTrail': './shared/src/services/security/auditTrail.js',
      './services/accessibility/accessibilityService': './shared/src/services/accessibility/accessibilityService.js',
    }
  };
  
  // Crear resolvedAliases para el modo unificado
  const resolvedAliases = {
    '@': resolve(__dirname, 'shell/src'),
    '@shell': resolve(__dirname, 'shell/src'),
    '@auth': resolve(__dirname, 'auth/src'),
    '@documents': resolve(__dirname, 'documents/src'),
    '@mesa-partes': resolve(__dirname, 'mesa-partes/src'),
    '@users': resolve(__dirname, 'users/src'),
    '@dashboard': resolve(__dirname, 'dashboard/src'),
    '@areas': resolve(__dirname, 'areas/src'),
    '@security': resolve(__dirname, 'security/src'),
    '@shared': resolve(__dirname, 'shared'),
    // Aliases específicos para la estructura interna
    '@/shared': resolve(__dirname, 'shared'),
    '@/services': resolve(__dirname, 'shell/src/services'),
    '@/utils': resolve(__dirname, 'shell/src/utils'),
    '@/components': resolve(__dirname, 'shell/src/components'),
    '@/assets': resolve(__dirname, 'shell/src/assets'),
    '@/store': resolve(__dirname, 'shell/src/store')
  };
  
  // Configuración para un solo servidor (puerto único)
  const unifiedConfig = {
    root: 'shell',
    plugins: [
      vue(),
      vueJsx(),
      federation({
        name: 'host',
        filename: 'remoteEntry.js',
        // No necesitamos remotes porque todo está en el mismo servidor
        exposes: {},
        remotes: {},
        shared: ['vue', 'vue-router', 'pinia']
      })
    ],
    resolve: {
      alias: resolvedAliases
    },
    server: {
      port: FRONTEND_PORT,
      cors: true,
      fs: {
        allow: [
          // Permitir acceso a todo el workspace detectado por Vite
          searchForWorkspaceRoot(process.cwd()),
          // Permitir acceso a node_modules para bootstrap-icons y su ruta completa
          resolve(__dirname, '../node_modules/bootstrap-icons'),
          resolve(__dirname, '../node_modules/bootstrap-icons/font'),
          resolve(__dirname, '../node_modules/bootstrap-icons/font/fonts')
        ]
      },
      proxy: {
        // Proxy para el backend
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        }
      },
      hmr: {
        port: FRONTEND_PORT
      }
    },
    build: {
      target: 'esnext',
      outDir: resolve(__dirname, 'dist'),
      assetsDir: 'assets',
      cssCodeSplit: false,
      minify: 'terser',
      terserOptions: {
        format: {
          comments: false
        }
      },
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'shell/index.html'),
        },
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'pinia'],
            'auth': ['./auth/src/index.js'],
            'documents': ['./documents/src/index.js'],
            'mesa-partes': ['./mesa-partes/src/index.js'],
            'users': ['./users/src/index.js'],
            'dashboard': ['./dashboard/src/index.js'],
            'areas': ['./areas/src/index.js'],
            'security': ['./security/src/index.js'],
            'shared': ['./shared/src/index.js'],
          }
        }
      }
    }
  };
  
  // Configuración específica para construir un solo módulo
  const singleModuleConfig = {
    root: module,
    plugins: [
      vue(),
      vueJsx(),
      federation({
        name: module,
        filename: 'remoteEntry.js',
        exposes: moduleExposes[module] || {},
        remotes: {},
        shared: ['vue', 'vue-router', 'pinia']
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, `${module}/src`),
        '@shared': resolve(__dirname, 'shared'),
        '@/shared': resolve(__dirname, 'shared'),
      }
    },
    build: {
      target: 'esnext',
      outDir: resolve(__dirname, `${module}/dist`),
      assetsDir: 'assets',
      cssCodeSplit: false,
      minify: 'terser',
      terserOptions: {
        format: {
          comments: false
        }
      }
    }
  };
  
  const config = module ? singleModuleConfig : unifiedConfig;
  
  console.log(`Configurando Vite para ${module ? `módulo: ${module}` : 'servidor unificado'} en puerto: ${FRONTEND_PORT}`);
  
  return config;
}); 