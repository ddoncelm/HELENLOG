# 🗣️ HelenLog — Seguimiento Evolutivo Logopédico

PWA para atención temprana logopédica. Funciona en iOS (instalable desde Safari) y en PC.

---

## Despliegue en Netlify (paso a paso)

### Opción A — Arrastrar carpeta (más rápido)

1. Ejecuta en tu ordenador:
   ```bash
   npm install
   npm run build
   ```
2. Entra en [app.netlify.com](https://app.netlify.com)
3. Arrastra la carpeta **`dist/`** al panel de Netlify
4. ¡Listo! Netlify te dará una URL tipo `https://helenlog.netlify.app`

### Opción B — GitHub + Netlify (recomendado para actualizaciones)

1. Sube este proyecto a un repositorio GitHub
2. En Netlify: **Add new site → Import from Git**
3. Selecciona el repositorio
4. Configuración de build:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Clic en **Deploy site**

---

## Instalar como app en iOS

1. Abre la URL en **Safari** (obligatorio, no Chrome)
2. Toca el botón **Compartir** (cuadrado con flecha ↑)
3. Selecciona **"Añadir a pantalla de inicio"**
4. Confirma → aparecerá el icono de HelenLog

## Instalar en PC (Chrome/Edge)

1. Abre la URL en Chrome o Edge
2. En la barra de direcciones aparecerá un icono de instalación (⊕)
3. Clic → **Instalar**

---

## Desarrollo local

```bash
npm install
npm run dev
# Abre http://localhost:3000
```

---

## Características

- 👶 Gestión de pacientes con ficha individual
- 📋 Checklists de hitos por franja de edad (0–48 meses)
- 🕸️ Gráfico de radar del perfil comunicativo
- 📈 Historial longitudinal de evaluaciones
- 📄 Exportación de informe HTML imprimible
- 💾 Datos guardados localmente (sin servidor, sin login)
- 📱 Funciona offline tras primera carga
