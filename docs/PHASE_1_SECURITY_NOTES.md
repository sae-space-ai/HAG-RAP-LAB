# PHASE_1_SECURITY_NOTES.md — Notas de Seguridad Fase 1

**Fecha:** 2025-01-15

---

## MEDIDAS IMPLEMENTADAS

### Validación de Entradas
- ✅ Esquemas Zod para todas las entradas POST
- ✅ Validación server-side (no solo cliente)
- ✅ Límite de payload: 1MB (express.json limit)
- ✅ Rechazo de entradas malformadas con código 400

### CORS
- ✅ Configurado con lista de orígenes permitidos
- ✅ Variables de entorno para producción (CORS_ORIGINS)
- ✅ Rechazo de orígenes no autorizados

### Manejo de Errores
- ✅ Sin trazas de stack en respuestas
- ✅ Sin exposición de rutas de archivos
- ✅ Sin exposición de consultas SQL
- ✅ Mensajes genéricos para errores internos (500)

### Autenticación
- ✅ Endpoint `/seed` protegido con `x-dev-token`
- ✅ Token configurable por variable de entorno
- ✅ Sin escrituras anónimas a instancia pública (si token configurado)

### Datos
- ✅ Sin secretos en código fuente
- ✅ Sin datos personales
- ✅ Sin claves API en frontend
- ✅ Todos los datos marcados SYNTHETIC

### Integridad
- ✅ Hashes de procedencia en evidence_links
- ✅ Cadena de auditoría con hashes encadenados
- ✅ Hash de inputs para reproducibilidad
- ✅ INSERT OR IGNORE para idempotencia

## MEDIDAS NO IMPLEMENTADAS (Futuras fases)

- ❌ Rate limiting avanzado
- ❌ Autenticación de usuarios
- ❌ Autorización por roles
- ❌ Cifrado en reposo
- ❌ Cifrado en tránsito (TLS — depende del despliegue)
- ❌ WAF / protección DDoS
- ❌ Auditoría de acceso detallada
- ❌ Rotación de tokens
- ❌ Firma criptográfica de fuentes

## ADVERTENCIAS

1. **SQLite local NO es apto para producción multiusuario**
2. **La cadena de hashes NO es prueba criptográfica** — solo detecta cambios accidentales
3. **El token de desarrollo NO es seguridad real** — es una medida básica
4. **CORS abierto en desarrollo** — restringir en producción
5. **No hay HTTPS** — depende del proxy inverso en despliegue
