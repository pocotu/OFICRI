# Manual de Áreas Especializadas - Sistema OFICRI

## Introducción

Este manual está dirigido a usuarios que trabajan en **Áreas Especializadas** del Sistema OFICRI, específicamente en las áreas de **Dosaje** y **Forense Digital**. Como responsable de área especializada, gestiona los documentos derivados desde Mesa de Partes y realiza los análisis periciales correspondientes.

## Permisos de Áreas Especializadas

Su rol incluye los siguientes permisos (bits 0,1,3,4,6 = valor 91):
- ✅ **Crear** (bit 0): Crear registros especializados y documentos internos
- ✅ **Editar** (bit 1): Modificar documentos y resultados de análisis
- ✅ **Ver** (bit 3): Consultar documentos de su área
- ✅ **Derivar** (bit 4): Derivar documentos a otras áreas o devolver a Mesa de Partes
- ✅ **Exportar** (bit 6): Generar informes periciales y reportes

## Área de Dosaje

### Descripción del Área

El **Área de Dosaje** se especializa en:
- Análisis toxicológicos de sangre y orina
- Determinación de alcohol en sangre
- Análisis de sustancias psicoactivas
- Peritajes químicos de drogas y estupefacientes
- Análisis de residuos de disparo

### Flujo de Trabajo en Dosaje

#### 1. Recepción de Documentos

Cuando recibe un documento derivado desde Mesa de Partes:

1. **Revise la derivación** en su bandeja de entrada
2. **Confirme la recepción** haciendo clic en "Recibir Documento"
3. **Verifique la información** del solicitante y tipo de análisis
4. **Evalúe la viabilidad** del análisis solicitado

#### 2. Registro de Caso de Dosaje

Complete el formulario especializado de Dosaje:

**Información del Registro**
- **Número de Registro**: Generado automáticamente
- **Fecha de Ingreso**: Fecha actual (automática)
- **Oficio Documento**: Número del oficio derivado
- **Número de Oficio**: Correlativo interno
- **Tipo de Dosaje**: Seleccione el tipo de análisis

**Información del Sujeto**
- **Nombres**: Nombres completos de la persona
- **Apellidos**: Apellidos completos
- **Documento de Identidad**: DNI o documento oficial
- **Procedencia**: Institución que solicita el análisis

**Detalles del Análisis**
- **Método de Análisis**: Técnica utilizada (GC-MS, ELISA, etc.)
- **Resultado Cualitativo**: POSITIVO, NEGATIVO, NO CONCLUYENTE
- **Resultado Cuantitativo**: Valor numérico si aplica
- **Unidad de Medida**: mg/L, ng/mL, etc.

#### 3. Tipos de Análisis de Dosaje

**Dosaje Etílico**
- Determinación de alcohol en sangre
- Rango normal: 0.0 - 0.5 g/L
- Métodos: Cromatografía de gases, espectrofotometría

**Dosaje Toxicológico**
- Detección de drogas en orina/sangre
- Sustancias: Cocaína, marihuana, anfetaminas, opiáceos
- Métodos: ELISA, GC-MS, LC-MS/MS

**Análisis de Sustancias**
- Identificación de drogas decomisadas
- Pureza y composición química
- Métodos: FTIR, GC-MS, análisis microscópico

#### 4. Procesamiento de Muestras

**Recepción de Muestras**
1. **Verifique la cadena de custodia** de las muestras
2. **Registre el estado** de las muestras (íntegras, alteradas)
3. **Asigne código interno** de laboratorio
4. **Almacene adecuadamente** según protocolo

**Análisis de Laboratorio**
1. **Prepare las muestras** según protocolo establecido
2. **Ejecute los análisis** con equipos calibrados
3. **Registre resultados** en el sistema
4. **Valide resultados** con controles de calidad

#### 5. Generación de Informes

**Informe Pericial de Dosaje**
1. **Complete todos los campos** del resultado
2. **Adjunte gráficos** o cromatogramas si aplica
3. **Redacte conclusiones** técnicas claras
4. **Genere el informe** en formato PDF
5. **Firme digitalmente** el documento

**Contenido del Informe**
- Datos del solicitante y caso
- Descripción de muestras analizadas
- Metodología empleada
- Resultados obtenidos
- Interpretación técnica
- Conclusiones y recomendaciones

## Área de Forense Digital

### Descripción del Área

El **Área de Forense Digital** se especializa en:
- Extracción de datos de dispositivos móviles
- Análisis forense de computadoras
- Recuperación de información eliminada
- Análisis de redes sociales y comunicaciones
- Peritajes de evidencia digital

### Flujo de Trabajo en Forense Digital

#### 1. Recepción de Dispositivos

**Documentación de Evidencia**
1. **Fotografíe el dispositivo** en estado original
2. **Documente el estado físico** (encendido, apagado, dañado)
3. **Registre números de serie** y características técnicas
4. **Verifique la cadena de custodia**

#### 2. Registro de Caso Forense Digital

Complete el formulario especializado:

**Información del Caso**
- **Número de Registro**: Generado automáticamente
- **Fecha de Ingreso**: Fecha actual
- **Tipo de Pericia**: Seleccione según el caso
- **Delito Investigado**: Descripción del delito

**Información del Imputado/Investigado**
- **Nombres y Apellidos**: Datos completos
- **Relación con el dispositivo**: Propietario, usuario, etc.

**Información del Dispositivo**
- **Tipo de Dispositivo**: Celular, computadora, tablet, etc.
- **Marca**: Samsung, Apple, Huawei, etc.
- **Modelo**: Modelo específico del dispositivo
- **Número de Serie**: IMEI, serial number
- **Estado**: Funcional, dañado, bloqueado

#### 3. Tipos de Peritajes Forenses

**Extracción de Datos Móviles**
- Contactos, mensajes, llamadas
- Fotos, videos, documentos
- Aplicaciones y datos de apps
- Ubicaciones GPS y mapas

**Análisis de Computadoras**
- Archivos del sistema y usuario
- Historial de navegación web
- Correos electrónicos
- Archivos eliminados y recuperables

**Análisis de Redes Sociales**
- Perfiles y actividad en redes
- Mensajes y conversaciones
- Fotos y videos compartidos
- Conexiones y contactos

#### 4. Métodos de Extracción

**Extracción Física**
- Copia bit a bit del dispositivo
- Acceso a datos eliminados
- Requiere herramientas especializadas
- Mayor tiempo de procesamiento

**Extracción Lógica**
- Acceso a datos activos únicamente
- Más rápida y menos invasiva
- Limitada a datos accesibles
- Ideal para casos urgentes

**Extracción Manual**
- Navegación manual del dispositivo
- Captura de pantalla de evidencias
- Para dispositivos no compatibles
- Documentación fotográfica

#### 5. Herramientas Especializadas

**Software Forense**
- Cellebrite UFED: Extracción móvil
- Oxygen Forensic Suite: Análisis integral
- EnCase: Análisis de computadoras
- FTK (Forensic Toolkit): Procesamiento de evidencia

**Hardware Especializado**
- Bloqueadores de señal (Faraday bags)
- Cables y adaptadores específicos
- Estaciones de trabajo forense
- Dispositivos de clonado

#### 6. Análisis y Procesamiento

**Procesamiento de Datos**
1. **Indexe la información** extraída
2. **Categorice por tipo** de evidencia
3. **Busque palabras clave** relevantes al caso
4. **Identifique patrones** de comportamiento
5. **Correlacione evidencias** entre dispositivos

**Análisis Temporal**
- Línea de tiempo de eventos
- Correlación de fechas y horas
- Identificación de períodos críticos
- Análisis de actividad por horarios

#### 7. Generación de Informes Forenses

**Informe Técnico**
- Descripción detallada del dispositivo
- Metodología de extracción empleada
- Herramientas y software utilizados
- Hash de verificación de integridad

**Informe de Hallazgos**
- Evidencias encontradas relevantes al caso
- Análisis de comunicaciones
- Actividad en aplicaciones
- Conclusiones técnicas

## Gestión de Estados de Documentos

### Estados Específicos de Áreas

**Estados en Dosaje**
- **MUESTRA_RECIBIDA**: Muestra física recibida
- **EN_ANALISIS**: Análisis de laboratorio en curso
- **ANALISIS_COMPLETADO**: Resultados obtenidos
- **INFORME_GENERADO**: Informe pericial listo
- **ENTREGADO**: Informe entregado al solicitante

**Estados en Forense Digital**
- **DISPOSITIVO_RECIBIDO**: Evidencia digital recibida
- **EXTRACCION_EN_CURSO**: Proceso de extracción activo
- **ANALISIS_EN_PROCESO**: Análisis de datos extraídos
- **INFORME_EN_REVISION**: Informe en proceso de revisión
- **PERITAJE_FINALIZADO**: Peritaje completado

### Actualización de Estados

1. **Seleccione el documento** en su área de trabajo
2. **Haga clic en "Cambiar Estado"**
3. **Seleccione el nuevo estado** apropiado
4. **Agregue observaciones** sobre el cambio
5. **Confirme la actualización**

## Derivaciones y Devoluciones

### Derivación a Otras Áreas

Cuando requiera colaboración de otra área especializada:

1. **Justifique la derivación** en observaciones
2. **Seleccione el área destino** apropiada
3. **Mantenga copia** del expediente original
4. **Haga seguimiento** del proceso

### Devolución a Mesa de Partes

Para documentos que requieren información adicional:

1. **Documente claramente** los requisitos faltantes
2. **Especifique el tipo** de información necesaria
3. **Establezca plazos** para la respuesta
4. **Mantenga el caso** en estado "OBSERVADO"

## Reportes Especializados

### Reportes de Productividad

**Reporte Mensual de Dosaje**
- Cantidad de análisis realizados por tipo
- Tiempos promedio de procesamiento
- Resultados estadísticos (positivos/negativos)
- Casos pendientes y en proceso

**Reporte Mensual de Forense Digital**
- Dispositivos procesados por tipo
- Métodos de extracción utilizados
- Casos resueltos vs. pendientes
- Tiempo promedio de análisis

### Reportes Técnicos

**Estadísticas de Análisis**
- Distribución de tipos de casos
- Tendencias en resultados
- Eficiencia de métodos empleados
- Recomendaciones de mejora

## Mejores Prácticas

### Cadena de Custodia

**Documentación Rigurosa**
- Registre cada manipulación de evidencia
- Mantenga sellos de seguridad íntegros
- Documente transferencias entre personal
- Conserve evidencia en condiciones apropiadas

### Control de Calidad

**Validación de Resultados**
- Use controles positivos y negativos
- Verifique calibración de equipos
- Mantenga trazabilidad de reactivos
- Documente desviaciones del protocolo

### Confidencialidad

**Manejo de Información Sensible**
- Acceda solo a casos asignados
- No discuta casos fuera del área
- Mantenga seguridad de archivos digitales
- Reporte accesos no autorizados

---

**Nota**: Como especialista forense, sus análisis y conclusiones tienen impacto directo en procesos judiciales. Mantenga siempre los más altos estándares de calidad y ética profesional.