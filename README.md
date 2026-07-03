# Recursos del Laboratorio TFD (LTF)

Este repositorio contiene las herramientas web y los recursos interactivos del **Laboratorio TFD**. Incluye juegos de preguntas (Quizz), evaluaciones de seminarios y el sistema del examen de bioseguridad.

## 🚀 Contenido del Repositorio

### 🎮 Sección de Quizz e Interacciones
* [**Panel de Administrador**](quizz-admin.html): Interfaz de administración para controlar las preguntas, respuestas e iniciar las rondas del juego.
* [**Interfaz de Jugador**](quizz-jugador.html): Pantalla de interacción para que los participantes respondan las preguntas en tiempo real.

### 📝 Evaluaciones y Formularios
* [**Evaluación de Presentación en Seminario**](evaluacion.html): Formulario interactivo para retroalimentación y evaluación de ponentes en seminarios.
* [**Examen de Bioseguridad**](Examen.html): Interfaz HTML utilizada por Google Apps Script para aplicar evaluaciones dinámicas sobre medidas de bioseguridad del laboratorio (soporta Versiones A y B).

### ⚙️ Automatización e Integración con Google Apps Script
* **`Code.gs`**: Código de backend en JavaScript de Google Apps Script. Gestiona la lógica de:
  - Servir la interfaz del examen (`doGet`).
  - Procesar las respuestas y guardarlas en una Google Sheet (`doPost`).
  - Calificar el examen contrastándolo con la hoja de configuración y enviar notificaciones automáticas por correo electrónico.
* **`enviar-prueba.ps1`**: Script de automatización en PowerShell que simula el envío de datos de examen (POST JSON) para probar la integración con el backend de Google Apps Script de forma remota.

## 🛠️ Tecnologías
- **Frontend**: HTML5, CSS3 y JavaScript nativo.
- **Backend**: Google Apps Script (integrado con Google Sheets y Gmail API).
- **Herramientas de Testeo**: PowerShell (para peticiones HTTP automatizadas).
