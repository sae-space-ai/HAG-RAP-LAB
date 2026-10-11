# 04_LIMITATIONS.md — Limitaciones del Prototipo

**Fecha:** 2025-01-15  
**Fase:** 0  
**TRL:** No aplicable (prototipo experimental)

---

## 1. LIMITACIONES CIENTÍFICAS

### Lo que NO es este prototipo
1. **NO es un motor de razonamiento causal.** No infiere causas ni efectos.
2. **NO es un sistema de abstracción.** No generaliza ni crea modelos del mundo.
3. **NO es un planificador.** No genera planes ni secuencias de acción.
4. **NO es un sistema de certificación.** No garantiza propiedades formales.
5. **NO es un modelo de IA.** No usa aprendizaje automático ni redes neuronales.
6. **NO realiza inferencia estadística.** No calcula probabilidades ni confianzas.
7. **NO tiene memoria a largo plazo.** Todo se pierde al reiniciar.

### Lo que SÍ es este prototipo
1. Un motor de **reconciliación de evidencias** basado en reglas deterministas.
2. Un sistema de **detección de contradicciones** por comparación de valores.
3. Un mecanismo de **abstención** cuando la evidencia es insuficiente o contradictoria.
4. Un registro de **procedencia** que traza cada dato a su fuente.
5. Una **interfaz demostrativa** que muestra el estado real de los componentes.

## 2. LIMITACIONES TÉCNICAS

### Arquitectura
- **SPA, no servidor:** Los "endpoints API" son funciones TypeScript, no HTTP real.
- **Sin persistencia:** Los datos se pierden al recargar la página.
- **In-memory only:** No hay base de datos, ficheros ni almacenamiento.
- **Sin autenticación:** No hay usuarios, roles ni permisos.
- **Sin concurrencia:** No maneja accesos simultáneos.

### Motor de evaluación
- **Comparación por igualdad estricta:** Dos valores son compatibles solo si son idénticos como strings.
- **Sin tolerancia numérica:** "22.0" ≠ "22" para el motor.
- **Sin contexto temporal:** No considera ventanas de tiempo para comparar evidencias.
- **Sin pesos de fuente:** Todas las fuentes tienen el mismo peso.
- **Sin cadena causal:** No rastrea relaciones causa-efecto entre evidencias.

### Datos
- **100% sintéticos:** Ningún dato proviene del mundo real.
- **4 fuentes ficticias:** Generadas para demostrar el motor.
- **5 evidencias ficticias:** Diseñadas para cubrir los 5 casos de prueba.
- **5 afirmaciones ficticias:** Cada una prueba una regla específica.

## 3. LIMITACIONES DE SEGURIDAD

### Lo que se hace correctamente
- ✅ Entradas validadas (IDs de caso verificados antes de procesar)
- ✅ Errores sin filtración de información interna
- ✅ Sin secretos en el código
- ✅ Sin acciones de escritura remotas
- ✅ Etiquetado SYNTHETIC en todos los datos
- ✅ Tipos estrictos TypeScript (strict mode)

### Lo que NO se hace (y por qué)
- ❌ **Sin autenticación:** No hay usuarios en Fase 0
- ❌ **Sin autorización:** No hay roles ni permisos
- ❌ **Sin rate limiting:** No hay servidor HTTP
- ❌ **Sin HTTPS:** Es un prototipo local
- ❌ **Sin auditoría:** No hay logs de seguridad
- ❌ **Sin cifrado:** Los datos son sintéticos y no sensibles

## 4. LIMITACIONES DE DATOS

### Clasificación
- Todos los datos: **SYNTHETIC**
- Ningún dato personal: ✅
- Ningún dato de socios: ✅
- Ningún dato contractual: ✅
- Ninguna clave o secreto: ✅

### Origen
- Las fuentes son textos ficticios sobre meteorología sintética
- Los valores son números inventados (temperatura, humedad, presión)
- Los sujetos son identificadores ficticios (SUBJ-TEMP-MADRID, etc.)
- Las fechas son inventadas pero en formato ISO 8601 válido

### Reproducción
- Los casos son deterministas (mismos datos → mismo resultado)
- La única no-determinista es `evaluatedAt` (timestamp de evaluación)
- El `algorithmVersion` es constante: `EGM-LITE-v0.1.0`

## 5. LIMITACIONES DEL ENTORNO

### Sandbox actual
- No se puede ejecutar vitest como proceso separado
- No hay servidor HTTP para probar endpoints reales
- No hay navegador headless para tests E2E
- No hay Git para verificar control de versiones
- No hay CI/CD (GitHub Actions)

### Para producción futura se necesitaría
- Servidor Node.js o framework SSR (Next.js)
- Base de datos con persistencia real
- Sistema de autenticación y autorización
- CI/CD con tests automatizados
- Monitorización y logs
- Revisión de seguridad independiente
- Validación TRL progresiva (TRL 1→4)

## 6. LIMITACIONES LEGALES Y ÉTICAS

- Este prototipo **NO toma decisiones operativas** sobre personas
- **NO actúa sobre administraciones, empresas o sistemas físicos**
- **NO sustituye el juicio humano** en ninguna decisión
- La abstención es el comportamiento por defecto ante incertidumbre
- TRL 4 es un objetivo futuro, no una afirmación del estado actual
