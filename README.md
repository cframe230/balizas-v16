# Balizas V16 – Visor en Tiempo Real

Aplicación web que muestra en un mapa interactivo todas las balizas V16 activas en España en tiempo real, utilizando datos oficiales de la DGT (formato DATEX II).

Proyecto 100% frontend, sin frameworks, orientado a visualización de datos, mapas interactivos y consumo de APIs públicas reales.

---

## Demo en Vivo

Aplicación disponible en:

https://jdamiancabello.github.io/balizas-v16

Repositorio:

https://github.com/JDamianCabello/balizas-v16

---

## Características

- Mapa interactivo basado en OpenLayers
- Panel de ajustes con botón flotante
- Cambio entre vista de mapa estándar y vista satélite
- Sistema multiidioma (Español / Inglés)
- Marcadores personalizados para cada baliza V16
- Información detallada al seleccionar una baliza
- Actualización automática cada 5 minutos con cuenta atrás
- Contador de balizas activas en tiempo real
- Ajuste automático del zoom para mostrar todas las balizas
- Diseño responsive optimizado para dispositivos móviles
- Aplicación 100% del lado del cliente (HTML y JavaScript)
- Preferencias de usuario persistentes mediante localStorage

---

## Cómo Usar

### Opción 1: Abrir localmente

Abre el archivo `index.html` en cualquier navegador moderno.  
La aplicación cargará automáticamente los datos utilizando el proxy público CodeTabs.

### Controles de la Aplicación

**Botón de ajustes**
- Ubicado en la esquina inferior derecha
- Permite abrir y cerrar el panel de configuración

**Panel de ajustes**
- Vista del mapa: selección entre mapa estándar y vista satélite
- Idioma: Español o Inglés
- Las preferencias se guardan automáticamente en localStorage

**Interacción con el mapa**
- Selección de balizas para ver información detallada
- Zoom mediante rueda del ratón o gestos táctiles
- Desplazamiento del mapa mediante arrastre

---

## Cómo Funciona

### Restricciones CORS

La API de la DGT impide el acceso directo desde el navegador por restricciones CORS.  
La aplicación utiliza el proxy público CodeTabs (https://api.codetabs.com) para resolver esta limitación sin necesidad de backend propio.

### Flujo de datos

