#!/bin/bash

# Script para ejecutar tests de API localmente
# Requiere Newman instalado: npm install -g newman

echo "🚀 Iniciando pruebas de API OFICRI"

# Verificar si newman está instalado
if ! command -v newman &> /dev/null; then
    echo "⚠️ Newman no está instalado. Instalando..."
    npm install -g newman
fi

# Verificar si el servidor está en ejecución
echo "🔍 Verificando si el servidor está en ejecución..."
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ Servidor detectado en puerto 3002"
else
    echo "⚠️ Iniciando servidor de prueba..."
    # Ir al directorio del servidor e iniciar en segundo plano
    cd ../server && node test-server.js &
    # Esperar a que el servidor esté disponible
    echo "⏳ Esperando a que el servidor esté listo..."
    sleep 5
fi

# Ejecutar pruebas
echo "🧪 Ejecutando pruebas API..."
newman run ./OFICRI_API_Tests.postman_collection.json -e ./dev_environment.json

# Capturar código de salida de newman
TEST_RESULT=$?

# Mostrar resultado
if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ Pruebas completadas exitosamente!"
else
    echo "❌ Algunas pruebas fallaron. Revisar los resultados."
fi

exit $TEST_RESULT 