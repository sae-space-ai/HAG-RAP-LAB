# PHASE_1_LIMITATIONS.md — Limitaciones Fase 1

**Fecha:** 2025-01-15

---

## LIMITACIONES TÉCNICAS

### Persistencia
- SQLite local: NO apto para Vercel serverless ni producción multiusuario
- Para producción se requiere PostgreSQL gestionado (no implementado)
- No hay replicación ni backup automático
- WAL mode habilitado pero sin configuración de durability avanzada

### Motor de Evaluación
- Comparación por igualdad estricta de strings (no tolerancia numérica)
- Sin manejo de unidades de medida diferentes
- Sin ventanas temporales para comparación
- Sin pesos de fuente diferenciados
- No distingue fuentes derivadas de independientes (solo marca transformación)

### API
- Sin rate limiting
- Sin paginación en listas
- Sin versionado de API (solo /v1/)
- Sin WebSocket para actualizaciones en tiempo real

### Frontend
- Requiere backend corriendo para funcionar
- Sin modo offline
- Sin cache de respuestas

## LIMITACIONES CIENTÍFICAS

- NO es inferencia causal
- NO es razonamiento profundo
- NO es abstracción
- NO es planificación
- NO es certificación formal
- NO tiene modelos de IA conectados
- TRL: No validado (prototipo experimental)

## LIMITACIONES DEL ENTORNO

- Tests no ejecutados en sandbox (requieren better-sqlite3 nativo)
- Servidor no levantado en sandbox
- Sin CI/CD verificado
- Sin Git remoto configurado
