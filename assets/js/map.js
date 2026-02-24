/**
 * Módulo para gestionar el mapa de OpenLayers
 * Inicialización, renderizado de markers y eventos
 */

window.MapManager = {
    // Estado interno
    map: null,
    vectorSource: null,
    vectorLayer: null,
    userSource: null,
    userLayer: null,
    userFeature: null,
    osmLayer: null,
    satelliteLayer: null,
    currentLayer: 'osm',
    beaconStyle: null,
    beaconIcon: null,
    beaconBlinkTimer: null,
    beaconBlinkOn: true,

    // Configuración
    config: {
        MAP_CENTER: [-3.7038, 40.4168], // Madrid (lon, lat)
        MAP_ZOOM: 6,
        BEACON_ICON_PATH: './assets/images/baliza-intermitente-32px.png',
        USER_ICON_PATH: './assets/images/person.png'
    },

    /**
     * Inicializa el mapa de OpenLayers
     */
    init() {
        console.log('Inicializando mapa...');

        // Crear capa OSM
        this.osmLayer = new ol.layer.Tile({
            source: new ol.source.OSM(),
            visible: true
        });

        // Crear capa satélite (ESRI World Imagery)
        this.satelliteLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attributions: 'Tiles © Esri'
            }),
            visible: false
        });

        // Crear fuente de datos vectorial para los markers
        this.vectorSource = new ol.source.Vector();

        this.userSource = new ol.source.Vector();

        // Crear estilos para el parpadeo (Normal y con filtro)
        this.beaconStyleNormal = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                src: this.config.BEACON_ICON_PATH,
                scale: 1
            })
        });

        this.beaconStyleHighlight = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                src: this.config.BEACON_ICON_PATH,
                scale: 1,
                color: '#FFD54F' // Filtro amarillo-naranja más claro (Amber 200)
            })
        });

        this.vectorLayer = new ol.layer.Vector({
            source: this.vectorSource,
            style: this.beaconStyleNormal
        });

        this.userLayer = new ol.layer.Vector({
            source: this.userSource,
            style: new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 1],
                    src: this.config.USER_ICON_PATH,
                    scale: 1
                })
            })
        });

        // Crear mapa con ambas capas base
        this.map = new ol.Map({
            target: 'map',
            layers: [
                this.osmLayer,
                this.satelliteLayer,
                this.userLayer,
                this.vectorLayer
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat(this.config.MAP_CENTER),
                zoom: this.config.MAP_ZOOM
            }),
            controls: ol.control.defaults.defaults({
                zoom: false
            })
        });

        // Configurar eventos
        this.map.on('click', (evt) => this.handleMapClick(evt));
        this.map.on('pointermove', (e) => this.handlePointerMove(e));

        // Configurar selector de capa
        this.setupLayerSelector();

        this.setupPopup();

        this.startBeaconBlinking();

        console.log('Mapa inicializado correctamente');
    },

    /**
     * Maneja el clic en el mapa
     * @param {object} evt - Evento de clic
     */
    handleMapClick(evt) {
        const feature = this.map.forEachFeatureAtPixel(evt.pixel, (feature) => feature);

        if (feature) {
            const props = feature.getProperties();
            this.showBeaconPopup(props);
        }
    },

    /**
     * Maneja el movimiento del puntero sobre el mapa
     * @param {object} e - Evento de movimiento
     */
    handlePointerMove(e) {
        const pixel = this.map.getEventPixel(e.originalEvent);
        const hit = this.map.hasFeatureAtPixel(pixel);
        const target = this.map.getTargetElement();

        if (target) {
            target.style.cursor = hit ? 'pointer' : '';
        }
    },

    setupPopup() {
        const popup = document.getElementById('beacon-popup');
        const closeBtn = document.getElementById('beacon-popup-close');

        if (!popup || !closeBtn) {
            return;
        }

        closeBtn.addEventListener('click', () => {
            popup.classList.add('hidden');
        });

        popup.addEventListener('click', (event) => {
            if (event.target === popup) {
                popup.classList.add('hidden');
            }
        });
    },

    showBeaconPopup(props) {
        const popup = document.getElementById('beacon-popup');
        const titleEl = document.getElementById('beacon-popup-title');
        const locationEl = document.getElementById('beacon-popup-location');
        const timeEl = document.getElementById('beacon-popup-time');
        const typeEl = document.getElementById('beacon-popup-type');
        const openMapsEl = document.getElementById('beacon-popup-open-google-maps');

        if (!popup || !titleEl || !locationEl || !timeEl || !typeEl || !openMapsEl) {
            return;
        }

        titleEl.textContent = I18n.get('beacon');
        locationEl.textContent = props.location || I18n.get('unknown');
        timeEl.textContent = this.formatTime(props.time) || I18n.get('unknown');
        typeEl.textContent = this.formatType(props.type) || I18n.get('unknown');

        const lat = typeof props.lat === 'number' ? props.lat : Number(props.lat);
        const lon = typeof props.lon === 'number' ? props.lon : Number(props.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`;
            openMapsEl.href = url;
            openMapsEl.style.display = 'inline-flex';
        } else {
            openMapsEl.href = '#';
            openMapsEl.style.display = 'none';
        }

        popup.classList.remove('hidden');
    },

    startBeaconBlinking() {
        if (this.beaconBlinkTimer) {
            clearInterval(this.beaconBlinkTimer);
        }

        this.beaconBlinkOn = false;
        
        // Función de actualización de estilo que fuerza el redibujado
        const updateStyle = () => {
            if (this.vectorLayer) {
                this.vectorLayer.setStyle(this.beaconBlinkOn ? this.beaconStyleHighlight : this.beaconStyleNormal);
                // Forzar redibujado explícito para evitar problemas durante el arrastre
                this.vectorLayer.changed();
            }
        };

        // Establecer estado inicial
        updateStyle();

        this.beaconBlinkTimer = setInterval(() => {
            this.beaconBlinkOn = !this.beaconBlinkOn;
            updateStyle();
        }, 700);
    },

    /**
     * Renderiza las balizas en el mapa
     * @param {Array} beacons - Array de objetos con datos de balizas
     */
    renderBeacons(beacons) {
        // Limpiar markers existentes
        this.vectorSource.clear();

        // Agregar nuevos markers
        const features = beacons.map((beacon) => new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([beacon.lon, beacon.lat])),
            id: beacon.id,
            lat: beacon.lat,
            lon: beacon.lon,
            time: beacon.time,
            type: beacon.type,
            location: beacon.location
        }));

        this.vectorSource.addFeatures(features);

        console.log(`${beacons.length} balizas renderizadas en el mapa`);

        // Si hay balizas, ajustar vista para mostrarlas todas
        if (beacons.length > 0) {
            const extent = this.vectorSource.getExtent();
            this.map.getView().fit(extent, {
                padding: [50, 50, 50, 50],
                maxZoom: 16,
                duration: 1000
            });
        }
    },

    setUserLocation(lon, lat) {
        const coordinate = ol.proj.fromLonLat([lon, lat]);

        if (this.userFeature) {
            this.userFeature.setGeometry(new ol.geom.Point(coordinate));
        } else {
            this.userFeature = new ol.Feature({
                geometry: new ol.geom.Point(coordinate)
            });

            this.userSource.addFeature(this.userFeature);
        }

        if (this.map) {
            this.map.getView().setCenter(coordinate);
            this.map.getView().setZoom(14);
        }
    },

    focusUserLocation() {
        if (!this.map || !this.userFeature) {
            return false;
        }

        const geometry = this.userFeature.getGeometry();
        if (!geometry) {
            return false;
        }

        const coordinate = geometry.getCoordinates();
        const view = this.map.getView();
        const currentZoom = typeof view.getZoom() === 'number' ? view.getZoom() : 0;

        view.animate({
            center: coordinate,
            zoom: Math.max(currentZoom, 14),
            duration: 450
        });

        return true;
    },

    /**
     * Formatea la hora para mostrar
     * @param {string} timeStr - String de tiempo ISO
     * @returns {string} Hora formateada
     */
    formatTime(timeStr) {
        if (!timeStr || timeStr === 'N/A') return 'N/A';

        try {
            const date = new Date(timeStr);
            return date.toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return timeStr;
        }
    },

    /**
     * Formatea el tipo de obstrucción
     * @param {string} type - Tipo de obstrucción
     * @returns {string} Tipo formateado
     */
    formatType(type) {
        // Intentar obtener traducción del tipo
        const translatedType = I18n.get(type);

        // Si la traducción es igual al tipo, significa que no existe traducción
        if (translatedType !== type) {
            return translatedType;
        }

        // Si no hay traducción específica, devolver valor por defecto
        return type || I18n.get('vehicleStopped');
    },

    /**
     * Configura el selector de capas (botones)
     */
    setupLayerSelector() {
        const btnOsm = document.getElementById('btn-map-osm');
        const btnSatellite = document.getElementById('btn-map-satellite');

        if (btnOsm && btnSatellite) {
            btnOsm.addEventListener('click', () => {
                this.switchLayer('osm');
                btnOsm.classList.add('active');
                btnSatellite.classList.remove('active');
            });

            btnSatellite.addEventListener('click', () => {
                this.switchLayer('satellite');
                btnSatellite.classList.add('active');
                btnOsm.classList.remove('active');
            });
        }
    },

    /**
     * Cambia entre capas del mapa
     * @param {string} layerType - Tipo de capa ('osm' o 'satellite')
     */
    switchLayer(layerType) {
        console.log(`Cambiando a capa: ${layerType}`);

        if (layerType === 'osm') {
            this.osmLayer.setVisible(true);
            this.satelliteLayer.setVisible(false);
            this.currentLayer = 'osm';
        } else if (layerType === 'satellite') {
            this.osmLayer.setVisible(false);
            this.satelliteLayer.setVisible(true);
            this.currentLayer = 'satellite';
        }
    }
};

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.MapManager;
}
