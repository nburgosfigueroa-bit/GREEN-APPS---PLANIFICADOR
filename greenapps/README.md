# GreenApps — Sistema de Gestión de Mantenimiento Urbano
> Maipú Zona 6 (AKRO) · Versión 1.0 · Fase 1 completada

---

## 📋 Descripción del Sistema

Sistema web para la gestión operativa de mantenimiento de áreas verdes y obras urbanas. Permite registrar órdenes de trabajo, adjuntar evidencia multimedia, dar seguimiento a tareas y aprobar/rechazar trabajos mediante un panel de cierre.

### Flujo Principal
```
Login → Dashboard → Nueva OT → Adjuntar Evidencia → Enviar → Revisión → Aprobar/Rechazar → Cerrar
```

---

## 🚀 Cómo abrir la aplicación (sin Node.js)

**Simplemente abre el archivo en el navegador:**

```
greenapps/index.html
```

Doble clic en el archivo → Se abre en Chrome/Edge/Firefox.

> ✅ No requiere servidor. No requiere instalación. Funciona directamente.

---

## 📁 Estructura del Proyecto

```
greenapps/
├── index.html          ← Aplicación completa (SPA)
├── .env.example        ← Plantilla de variables de entorno
├── .gitignore          ← Archivos excluidos del repositorio
├── README.md           ← Este archivo
└── assets/             ← Carpeta para imágenes y recursos locales
```

---

## 🖥️ Páginas Implementadas (Fase 1)

| Ruta (interna) | Pantalla | Estado |
|---|---|---|
| `login` | Inicio de Sesión Seguro | ✅ |
| `crear-perfil` | Creación de Perfil | ✅ |
| `registro-exitoso` | Confirmación de Registro | ✅ |
| `dashboard` | Dashboard de Avance | ✅ |
| `tareas` | Registro de Órdenes de Trabajo | ✅ |
| `multimedia` | Galería y Reportes | ✅ |
| `cierre` | Panel de Cierre / Aprobar-Rechazar | ✅ |
| `perfil` | Mi Perfil y Ajustes | ✅ |
| `administracion` | Administración de Perfiles | ✅ |

---

## 🎨 Stack Tecnológico (Fase 1)

- **HTML5** semántico + SPA con router JS vanilla
- **Tailwind CSS v3** (CDN) con los tokens de diseño exactos de Google Stitch
- **Material Symbols Outlined** (Google Fonts)
- **Fuentes**: Hanken Grotesk · Inter · JetBrains Mono (Google Fonts)
- **Datos**: Simulados localmente en JavaScript

---

## 🔐 Seguridad

- **Nunca** almacenes contraseñas en el código
- Usar `.env.example` como plantilla → copiar a `.env` con valores reales
- El archivo `.env` está en `.gitignore` y **nunca se sube al repositorio**

---

## 🗺️ Roadmap

### Fase 1 ✅ — Base Visual (Completada)
- SPA funcional con todas las pantallas
- Navegación entre vistas
- Datos simulados localmente

### Fase 2 (Próxima) — Backend con Supabase
- Autenticación real (email/password + Microsoft OAuth)
- Base de datos PostgreSQL en Supabase
- Almacenamiento de imágenes/videos
- Migración a React + Vite

### Fase 3 — Integraciones Externas
- Sincronización con OneDrive
- Generación de PDF (órdenes de trabajo)
- Notificaciones por correo
- Dashboard con datos en tiempo real

---

## 📞 Soporte
Sistema desarrollado para operaciones de mantenimiento de áreas verdes.  
Contrato: Maipú Zona 6 · Empresa: AKRO
