/**
 * Módulo de internacionalización (i18n)
 * Gestiona las traducciones español/inglés
 */

const I18n = {
    // Idioma actual
    currentLanguage: 'es',

    // Traducciones
    translations: {
        es: {
            // Panel de ajustes
            settings: 'Ajustes',
            mapView: 'Vista del mapa',
            language: 'Idioma',
            installAppLabel: 'Instalar aplicación',
            installApp: 'Instalar',
            installHelp: 'Cómo instalar',
            installPromptIos: 'En iPhone, toca Compartir y luego "Añadir a pantalla de inicio".',
            installPromptOther: 'Para instalar la aplicación, use "Añadir a pantalla de inicio" en el navegador.',

            // Panel de información
            activeBeacons: 'Balizas V16 Activas',
            loading: 'Cargando datos...',
            dataLoaded: 'Datos cargados correctamente',
            error: 'Error',
            lastUpdate: 'Última actualización',
            nextUpdate: 'Próxima actualización en',

            dgtNotice: 'La DGT solo publica información sobre la activación de dispositivos V16 en carreteras y autopistas nacionales. No se publican las balizas activadas en zonas urbanas ni en áreas alejadas de la red viaria.',

            myLocation: 'Mi ubicación',

            // Popup de baliza
            beacon: 'Baliza V16',
            location: 'Ubicación',
            time: 'Hora',
            type: 'Tipo',
            unknown: 'Desconocido',

            // Tipos de vehículo
            vehicleStuck: 'Vehículo atascado',
            vehicleOnFire: 'Vehículo en llamas',
            vehicleSpunOut: 'Vehículo accidentado',
            vehicleBreakdown: 'Vehículo averiado',
            brokenDownVehicle: 'Vehículo averiado',
            accidentalSpillageOnTheRoad: 'Derrame en la carretera',
            vehicleStopped: 'Vehículo detenido'
        },
        en: {
            // Settings panel
            settings: 'Settings',
            mapView: 'Map view',
            language: 'Language',
            installAppLabel: 'Install app',
            installApp: 'Install',
            installHelp: 'How to install',
            installPromptIos: 'On iPhone, tap Share and then "Add to Home Screen".',
            installPromptOther: 'To install the app, use "Add to Home Screen" in your browser.',

            // Info panel
            activeBeacons: 'Active V16 Beacons',
            loading: 'Loading data...',
            dataLoaded: 'Data loaded successfully',
            error: 'Error',
            lastUpdate: 'Last update',
            nextUpdate: 'Next update in',

            dgtNotice: 'The DGT only publishes information on V16 device activation on national roads and highways. Beacons activated in urban areas or areas far from the road network are not published.',

            myLocation: 'My location',

            // Beacon popup
            beacon: 'V16 Beacon',
            location: 'Location',
            time: 'Time',
            type: 'Type',
            unknown: 'Unknown',

            // Vehicle types
            vehicleStuck: 'Vehicle stuck',
            vehicleOnFire: 'Vehicle on fire',
            vehicleSpunOut: 'Vehicle spun out',
            vehicleBreakdown: 'Vehicle breakdown',
            brokenDownVehicle: 'Broken down vehicle',
            accidentalSpillageOnTheRoad: 'Accidental spillage on road',
            vehicleStopped: 'Vehicle stopped'
        }
    },

    /**
     * Inicializa el sistema de traducción
     */
    init() {
        // Cargar idioma guardado o usar español por defecto
        const savedLang = localStorage.getItem('language') || 'es';
        this.setLanguage(savedLang, false);
    },

    /**
     * Cambia el idioma de la aplicación
     * @param {string} lang - Código de idioma ('es' o 'en')
     * @param {boolean} save - Si debe guardar en localStorage
     */
    setLanguage(lang, save = true) {
        if (!this.translations[lang]) {
            console.warn(`Idioma ${lang} no soportado`);
            return;
        }

        this.currentLanguage = lang;

        if (save) {
            localStorage.setItem('language', lang);
        }

        // Actualizar todos los elementos con data-i18n
        this.updateDOM();

        console.log(`Idioma cambiado a: ${lang}`);
    },

    /**
     * Actualiza el DOM con las traducciones actuales
     */
    updateDOM() {
        const elements = document.querySelectorAll('[data-i18n]');

        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.get(key);

            if (translation) {
                // Si es un input, actualizar placeholder
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
    },

    /**
     * Obtiene una traducción
     * @param {string} key - Clave de traducción
     * @returns {string} Texto traducido
     */
    get(key) {
        return this.translations[this.currentLanguage][key] || key;
    },

    /**
     * Obtiene el idioma actual
     * @returns {string} Código de idioma actual
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
};

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
}
