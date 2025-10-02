# Manual de Mesa de Partes - Sistema OFICRI

## Introducción

Este manual está dirigido a usuarios con rol de **Mesa de Partes** del Sistema OFICRI. Como operador de Mesa de Partes, es responsable de la recepción, registro y derivación inicial de documentos hacia las áreas especializadas correspondientes.

## Permisos de Mesa de Partes

Su rol incluye los siguientes permisos (bits 0,1,3,4,6 = valor 91):
- ✅ **Crear** (bit 0): Registrar nuevos documentos
- ✅ **Editar** (bit 1): Modificar documentos en proceso
- ✅ **Ver** (bit 3): Consultar documentos y reportes
- ✅ **Derivar** (bit 4): Enviar documentos a áreas especializadas
- ✅ **Exportar** (bit 6): Generar reportes de recepción

## Flujo de Trabajo Principal

### 1. Recepción de Documentos

#### Documentos Físicos
1. **Reciba el documento físico** del solicitante
2. **Verifique la documentación** requerida
3. **Asigne número de registro** automático del sistema
4. **Digitalice el documento** (escaneo o fotografía)
5. **Registre en el sistema** con todos los datos requeridos

#### Documentos Digitales
1. **Reciba el documento** por correo electrónico o plataforma digital
2. **Verifique la autenticidad** y completitud
3. **Registre en el sistema** directamente
4. **Adjunte archivos** digitales al registro

### 2. Registro de Documentos

#### Formulario de Registro

Complete todos los campos obligatorios:

**Información Básica**
- **Número de Registro**: Generado automáticamente por el sistema
- **Número de Oficio**: Número del documento oficial
- **Fecha del Documento**: Fecha de emisión del documento
- **Origen del Documento**: EXTERNO (por defecto para Mesa de Partes)

**Información del Solicitante**
- **Procedencia**: Institución o persona que envía el documento
- **Contenido**: Descripción detallada del requerimiento
- **Observaciones**: Notas adicionales relevantes

**Clasificación**
- **Tipo de Documento**: Seleccione según la naturaleza del requerimiento
- **Prioridad**: NORMAL, URGENTE, MUY_URGENTE
- **Área Destino**: Área especializada correspondiente

#### Validaciones del Sistema

El sistema validará automáticamente:
- **Número de oficio único**: No duplicados en el sistema
- **Campos obligatorios**: Todos los campos requeridos completos
- **Formato de archivos**: Solo PDF, JPG, PNG permitidos
- **Tamaño de archivos**: Máximo 10MB por archivo

### 3. Derivación de Documentos

#### Proceso de Derivación

1. **Seleccione el documento** desde la tabla principal
2. **Haga clic en "Derivar"** 📤
3. **Complete el formulario de derivación**:
   - **Área Destino**: Seleccione el área especializada
   - **Usuario Responsable**: Opcional, puede asignar a un usuario específico
   - **Observaciones**: Instrucciones o notas para el área receptora
   - **Prioridad**: Confirme o modifique la prioridad
4. **Confirme la derivación**

#### Áreas de Derivación Disponibles

**Áreas Especializadas**
- **Dosaje**: Análisis toxicológicos y de sustancias
- **Forense Digital**: Peritajes de dispositivos electrónicos
- **Química Toxicología**: Análisis químicos forenses
- **Otras áreas**: Según configuración del sistema

**Criterios de Derivación**
- **Dosaje**: Solicitudes de análisis de sangre, orina, sustancias
- **Forense Digital**: Peritajes de celulares, computadoras, dispositivos
- **Química**: Análisis de drogas, explosivos, materiales químicos

### 4. Seguimiento de Documentos

#### Estados de Seguimiento

Monitoree el progreso de los documentos derivados:

- **RECIBIDO**: Documento registrado en Mesa de Partes
- **DERIVADO**: Enviado a área especializada
- **EN_PROCESO**: Siendo procesado por el área
- **OBSERVADO**: Requiere información adicional
- **FINALIZADO**: Trámite completado con informe
- **ARCHIVADO**: Documento archivado

#### Panel de Seguimiento

Utilice el dashboard para monitorear:
- **Documentos del día**: Registrados hoy
- **Pendientes de derivación**: Requieren asignación de área
- **En proceso**: Derivados y en trámite
- **Finalizados**: Completados en las últimas 24 horas

## Gestión de Archivos Digitales

### Digitalización de Documentos

#### Estándares de Digitalización
- **Resolución**: Mínimo 300 DPI para documentos de texto
- **Formato**: PDF preferido, JPG/PNG para imágenes
- **Orientación**: Correcta y legible
- **Calidad**: Clara y sin distorsiones

#### Nomenclatura de Archivos
Use el siguiente formato:
```
OFICRI_[NUMERO_REGISTRO]_[TIPO]_[FECHA]
Ejemplo: OFICRI_2025001_OFICIO_20250115.pdf
```

### Adjuntar Archivos al Sistema

1. **Desde el formulario de documento**, haga clic en "Adjuntar Archivo"
2. **Seleccione el archivo** desde su computadora
3. **Especifique el tipo de archivo**:
   - Documento principal
   - Anexo
   - Identificación del solicitante
   - Otros documentos de soporte
4. **Agregue observaciones** sobre el archivo
5. **Confirme la carga**

## Consultas y Reportes

### Consultas Frecuentes

#### Búsqueda de Documentos
Utilice los filtros disponibles:
- **Por número de registro**: Búsqueda exacta
- **Por procedencia**: Institución solicitante
- **Por fecha**: Rango de fechas de recepción
- **Por estado**: Estado actual del documento
- **Por área**: Área donde se encuentra el documento

#### Consultas de Estado
Para consultas telefónicas o presenciales:
1. **Solicite el número de registro** al consultante
2. **Busque el documento** en el sistema
3. **Verifique el estado actual** y última actualización
4. **Proporcione información** del progreso del trámite

### Reportes de Mesa de Partes

#### Reporte Diario de Recepción
Genere al final de cada jornada:
- **Documentos recibidos**: Cantidad y detalle
- **Derivaciones realizadas**: Por área destino
- **Documentos pendientes**: Sin derivar
- **Estadísticas del día**: Resumen numérico

#### Reporte Semanal de Productividad
- **Total de documentos procesados**
- **Tiempo promedio de derivación**
- **Áreas más solicitadas**
- **Tipos de documentos más frecuentes**

#### Reporte Mensual Estadístico
- **Tendencias de recepción**: Comparativo mensual
- **Eficiencia de derivación**: Tiempos de respuesta
- **Satisfacción del usuario**: Si aplica
- **Recomendaciones de mejora**

## Procedimientos Especiales

### Documentos Urgentes

Para documentos marcados como **URGENTE** o **MUY_URGENTE**:

1. **Procese inmediatamente** sin demora
2. **Notifique al área destino** por teléfono o mensaje
3. **Registre la urgencia** en observaciones
4. **Haga seguimiento** cada 2 horas hasta confirmación de recepción

### Documentos Observados

Cuando un área devuelve un documento con observaciones:

1. **Revise las observaciones** del área especializada
2. **Contacte al solicitante** para aclarar o completar información
3. **Actualice el documento** con la información adicional
4. **Re-derive** a la misma área con las correcciones

### Documentos Rechazados

Si un documento no cumple con los requisitos:

1. **Documente el motivo** del rechazo claramente
2. **Notifique al solicitante** los requisitos faltantes
3. **Mantenga el registro** en estado "OBSERVADO"
4. **Proporcione orientación** sobre cómo completar la solicitud

## Atención al Público

### Recepción Presencial

#### Horarios de Atención
- **Lunes a Viernes**: 8:00 AM - 4:00 PM
- **Sábados**: 8:00 AM - 12:00 PM (si aplica)
- **Feriados**: Cerrado

#### Protocolo de Atención
1. **Salude cordialmente** al usuario
2. **Solicite la documentación** requerida
3. **Explique el proceso** y tiempos estimados
4. **Entregue comprobante** de recepción
5. **Proporcione información** de seguimiento

### Consultas Telefónicas

#### Información que Puede Proporcionar
- **Estado actual** del documento
- **Área responsable** del trámite
- **Fecha estimada** de finalización (si disponible)
- **Requisitos adicionales** si los hay

#### Información Restringida
- **Detalles técnicos** de los análisis
- **Resultados preliminares** de peritajes
- **Información de otros casos** no relacionados

## Mejores Prácticas

### Organización del Trabajo

#### Priorización de Tareas
1. **Documentos urgentes**: Procesar inmediatamente
2. **Consultas presenciales**: Atender sin demora
3. **Derivaciones pendientes**: Completar antes del mediodía
4. **Reportes diarios**: Generar al final de la jornada

#### Control de Calidad
- **Verifique datos** antes de guardar registros
- **Revise archivos adjuntos** por legibilidad
- **Confirme derivaciones** con áreas receptoras
- **Mantenga actualizado** el estado de documentos

### Comunicación Efectiva

#### Con Áreas Especializadas
- **Use terminología técnica** apropiada
- **Proporcione contexto** completo del caso
- **Confirme recepción** de derivaciones
- **Mantenga canales abiertos** para consultas

#### Con Usuarios/Solicitantes
- **Use lenguaje claro** y comprensible
- **Sea paciente** con consultas repetitivas
- **Proporcione información precisa** sobre tiempos
- **Mantenga profesionalismo** en todo momento

## Solución de Problemas Comunes

### Problemas Técnicos

#### Error al Subir Archivos
- **Verifique el tamaño**: Máximo 10MB
- **Confirme el formato**: PDF, JPG, PNG únicamente
- **Revise la conexión**: Internet estable requerida
- **Intente nuevamente**: Después de unos minutos

#### Sistema Lento
- **Cierre pestañas** innecesarias del navegador
- **Actualice la página**: F5 o Ctrl+F5
- **Limpie caché**: Del navegador
- **Contacte soporte**: Si persiste el problema

### Problemas de Proceso

#### Área Destino No Disponible
- **Verifique estado** del área en el sistema
- **Contacte administrador**: Para reactivar área
- **Use área alternativa**: Si está disponible
- **Documente el problema**: Para seguimiento

#### Documento Duplicado
- **Verifique número de oficio**: En el sistema
- **Consulte con solicitante**: Sobre duplicidad
- **Agregue sufijo**: Al número si es necesario
- **Documente la situación**: En observaciones

---

**Nota**: Como operador de Mesa de Partes, es el primer punto de contacto del sistema. Su eficiencia y profesionalismo impactan directamente en la percepción del servicio por parte de los usuarios.