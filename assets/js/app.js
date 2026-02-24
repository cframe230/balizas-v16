/**
 * Aplicación principal - Balizas V16 DGT
 * Coordina la carga de datos, renderizado y actualización
 */

window.App = {
    // Estado
    refreshTimer: null,
    countdownTimer: null,
    refreshInterval: 180000, // 180 segundos = 3 minutos
    remainingSeconds: 180,
    deferredInstallPrompt: null,

    /**
     * Inicializa la aplicación
     */
    async init() {
        console.log('Iniciando aplicación Balizas V16...');

        // Inicializar sistema de traducción
        I18n.init();

        // Inicializar mapa
        MapManager.init();

        this.initUserLocation();

        // Configurar panel de ajustes
        this.setupSettingsPanel();

        // Configurar selector de idioma
        this.setupLanguageSelector();

        this.setupLocateButton();

        this.setupNoticeBox();

        this.setupPwaInstall();

        // Cargar datos iniciales
        await this.loadAndRenderBeacons();

        // Configurar actualización automática
        this.startAutoRefresh();

        console.log('Aplicación iniciada correctamente');
    },

    /**
     * Configura el cuadro de aviso de la DGT para que se oculte al hacer clic
     */
    setupNoticeBox() {
        const noticeBox = document.getElementById('dgt-notice-box');
        if (noticeBox) {
            noticeBox.addEventListener('click', () => {
                noticeBox.classList.add('hidden');
            });
        }
    },

    setupPwaInstall() {
        const installButton = document.getElementById('btn-install-pwa');
        if (!installButton) {
            return;
        }

        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        if (isStandalone) {
            installButton.style.display = 'none';
            return;
        }

        this.updateInstallButtonText();

        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.deferredInstallPrompt = event;
            this.updateInstallButtonText();
        });

        installButton.addEventListener('click', async () => {
            if (isIos) {
                alert(I18n.get('installPromptIos'));
                return;
            }

            if (this.deferredInstallPrompt) {
                this.deferredInstallPrompt.prompt();
                await this.deferredInstallPrompt.userChoice;
                this.deferredInstallPrompt = null;
                this.updateInstallButtonText();
                return;
            }

            alert(I18n.get('installPromptOther'));
        });
    },

    updateInstallButtonText() {
        const installButton = document.getElementById('btn-install-pwa');
        if (!installButton) {
            return;
        }

        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const key = isIos ? 'installHelp' : (this.deferredInstallPrompt ? 'installApp' : 'installHelp');
        installButton.textContent = I18n.get(key);
        installButton.setAttribute('data-i18n', key);
    },

    /**
     * Carga los datos de balizas y los renderiza
     */
    async loadAndRenderBeacons() {
        this.updateStatus('loading', 'loading');

        try {
            // Cargar balizas desde la API
            const beacons = await DgtApi.getBeacons();

            // Renderizar en el mapa
            MapManager.renderBeacons(beacons);

            // Actualizar UI
            this.updateBeaconCount(beacons.length);
            this.updateStatus('dataLoaded', 'success');
            this.updateLastUpdateTime();

            // Reiniciar cuenta atrás
            this.resetCountdown();

        } catch (error) {
            console.error('Error al cargar datos:', error);
            const errorMsg = I18n.get('error') + ': ' + error.message;
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.textContent = errorMsg;
                statusElement.className = 'error';
            }
        }
    },

    /**
     * Configura el panel de ajustes
     */
    setupSettingsPanel() {
        const settingsBtn = document.getElementById('settings-button');
        const settingsPanel = document.getElementById('settings-panel');

        if (settingsBtn && settingsPanel) {
            settingsBtn.addEventListener('click', () => {
                settingsPanel.classList.toggle('hidden');
            });

            // Cerrar al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
                    settingsPanel.classList.add('hidden');
                }
            });
        }
    },

    /**
     * Configura el selector de idioma
     */
    setupLanguageSelector() {
        const btnEs = document.getElementById('btn-lang-es');
        const btnEn = document.getElementById('btn-lang-en');

        if (btnEs && btnEn) {
            // Establecer estado inicial según idioma guardado
            const currentLang = I18n.getCurrentLanguage();
            if (currentLang === 'es') {
                btnEs.classList.add('active');
                btnEn.classList.remove('active');
            } else {
                btnEn.classList.add('active');
                btnEs.classList.remove('active');
            }

            btnEs.addEventListener('click', () => {
                I18n.setLanguage('es');
                btnEs.classList.add('active');
                btnEn.classList.remove('active');

                // Actualizar los textos dinámicos actuales
                this.updateDynamicTexts();
            });

            btnEn.addEventListener('click', () => {
                I18n.setLanguage('en');
                btnEn.classList.add('active');
                btnEs.classList.remove('active');

                // Actualizar los textos dinámicos actuales
                this.updateDynamicTexts();
            });
        }
    },

    initUserLocation() {
        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                MapManager.setUserLocation(longitude, latitude);
            },
            (error) => {
                console.warn('No se pudo obtener la ubicación del usuario:', error);
            }
        );
    },

    /**
     * Actualiza textos dinámicos después de cambio de idioma
     */
    updateDynamicTexts() {
        // Actualizar última actualización
        const lastUpdateEl = document.getElementById('last-update-time');
        if (lastUpdateEl && lastUpdateEl.textContent !== '--') {
            // Se mantiene la hora, solo cambia el texto
        }

        // Actualizar próxima actualización
        this.updateCountdownDisplay();

        this.updateLocateButtonA11y();

        this.updateInstallButtonText();
    },

    setupLocateButton() {
        const locateBtn = document.getElementById('locate-button');
        if (!locateBtn) {
            return;
        }

        locateBtn.addEventListener('click', () => {
            this.loadAndRenderBeacons();
            if (!navigator.geolocation) {
                console.warn('Geolocalización no soportada');
                return;
            }

            // Añadir una clase visual para indicar que está cargando
            locateBtn.style.opacity = '0.7';
            locateBtn.style.pointerEvents = 'none';

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // Actualizar posición en el mapa
                    MapManager.setUserLocation(longitude, latitude);
                    // Forzar el enfoque a la nueva posición
                    MapManager.focusUserLocation();
                    
                    // Restaurar botón
                    locateBtn.style.opacity = '1';
                    locateBtn.style.pointerEvents = 'auto';
                },
                (error) => {
                    console.warn('No se pudo obtener la ubicación del usuario:', error);
                    // Si falla el GPS pero ya teníamos una posición previa, al menos enfocamos esa
                    MapManager.focusUserLocation();
                    
                    // Restaurar botón
                    locateBtn.style.opacity = '1';
                    locateBtn.style.pointerEvents = 'auto';
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0 // Forzar posición fresca
                }
            );
        });

        this.updateLocateButtonA11y();
    },

    updateLocateButtonA11y() {
        const locateBtn = document.getElementById('locate-button');
        if (!locateBtn) {
            return;
        }

        const label = I18n.get('myLocation');
        locateBtn.title = label;
        locateBtn.setAttribute('aria-label', label);
    },

    /**
     * Actualiza el estado en el panel de información
     * @param {string} messageKey - Clave de traducción del mensaje
     * @param {string} className - Clase CSS ('loading', 'success', 'error')
     */
    updateStatus(messageKey, className) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = I18n.get(messageKey);
            statusElement.className = className;
            statusElement.setAttribute('data-i18n', messageKey);
        }
    },

    /**
     * Actualiza el contador de balizas
     * @param {number} count - Número de balizas
     */
    updateBeaconCount(count) {
        const countElement = document.getElementById('beacon-count');
        if (countElement) {
            countElement.textContent = count;
        }
    },

    /**
     * Actualiza la hora de última actualización
     */
    updateLastUpdateTime() {
        const timeElement = document.getElementById('last-update-time');
        if (timeElement) {
            const now = new Date();
            const locale = I18n.getCurrentLanguage() === 'es' ? 'es-ES' : 'en-US';
            const timeString = now.toLocaleTimeString(locale);
            timeElement.textContent = timeString;
        }
    },

    /**
     * Reinicia la cuenta atrás
     */
    resetCountdown() {
        // Detener cuenta atrás anterior si existe
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }

        // Reiniciar contador
        this.remainingSeconds = this.refreshInterval / 1000;

        // Iniciar nueva cuenta atrás
        this.countdownTimer = setInterval(() => {
            this.remainingSeconds--;
            this.updateCountdownDisplay();

            if (this.remainingSeconds <= 0) {
                clearInterval(this.countdownTimer);
            }
        }, 1000);

        // Actualizar display inmediatamente
        this.updateCountdownDisplay();
    },

    /**
     * Actualiza el display de la cuenta atrás
     */
    updateCountdownDisplay() {
        const nextUpdateElement = document.getElementById('next-update-time');
        if (nextUpdateElement) {
            const formatted = this.formatCountdown(this.remainingSeconds);
            nextUpdateElement.textContent = formatted;
        }
    },

    /**
     * Formatea los segundos restantes en un formato legible
     * @param {number} seconds - Segundos restantes
     * @returns {string} Tiempo formateado
     */
    formatCountdown(seconds) {
        if (seconds <= 0) {
            return I18n.getCurrentLanguage() === 'es' ? '0 segundos' : '0 seconds';
        }

        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            const label = I18n.getCurrentLanguage() === 'es' ? 'segundos' : 'seconds';
            return `${secs} ${label}`;
        }
    },

    /**
     * Inicia la actualización automática periódica
     */
    startAutoRefresh() {
        console.log(`Auto-refresh configurado cada ${this.refreshInterval / 1000} segundos`);

        this.refreshTimer = setInterval(() => {
            console.log('Actualizando datos...');
            this.loadAndRenderBeacons();
        }, this.refreshInterval);
    },

    /**
     * Detiene la actualización automática
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            console.log('Auto-refresh detenido');
        }

        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }
};

// Inicializar aplicación cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Limpiar al cerrar
window.addEventListener('beforeunload', () => {
    App.stopAutoRefresh();
});
