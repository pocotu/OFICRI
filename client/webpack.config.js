const path = require('path');

module.exports = {
  entry: {
    // Configuración
    'config/app.config': './src/config/app.config.js',
    
    // API y servicios
    'api/apiClient': './src/api/apiClient.js',
    'services/authService': './src/services/authService.js',
    'services/userService': './src/services/userService.js',
    
    // Utilidades
    'utils/validators': './src/utils/validators.js',
    'utils/errorHandlerUtil': './src/utils/errorHandlerUtil.js',
    'utils/httpUtil': './src/utils/httpUtil.js',
    'utils/authStateManager': './src/utils/authStateManager.js',
    'utils/loginUtils/loginFormRenderer': './src/utils/loginUtils/loginFormRenderer.js',
    'utils/loginUtils/loginLayoutRenderer': './src/utils/loginUtils/loginLayoutRenderer.js',
    'ui/notifications': './src/ui/notifications.js',
    
    // Páginas
    'pages/login/index': './src/pages/login/index.js',
    
    // Aplicación principal
    'app': './src/app.js',

    // Dashboard admin
    'admin/index': './src/admin/index.js',
    'admin/dashboard': './src/admin/dashboard.js',
    'admin/usuarios': './src/admin/usuarios.js',
    'admin/roles': './src/admin/roles.js',
    'admin/areas': './src/admin/areas.js',
    'admin/documentos': './src/admin/documentos.js',
    'admin/auditoria': './src/admin/auditoria.js',
    'admin/exportar': './src/admin/exportar.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public/js'),
    publicPath: 'js/'
  },
  resolve: {
    extensions: ['.js']
  },
  // Para desarrollo
  devtool: 'source-map'
}; 