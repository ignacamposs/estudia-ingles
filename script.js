// 1. Configuración y Claves (En un proyecto real, esto iría protegido)
const API_KEY = ""; // Usala directo acá por ahora si no tenés backend

const diccionario = [
    { eng: "Break a leg", esp: "¡Mucha suerte!" },
    { eng: "Piece of cake", esp: "Pan comido" },
    { eng: "Under the weather", esp: "Sentirse un poco mal / enfermo" },
    { eng: "Hang in there", esp: "No te rindas" },
    { eng: "Call it a day", esp: "Dar por terminado el día" }
];

// Memoria de la conversación (Persistencia local)
let historial = JSON.parse(localStorage.getItem('historial_chat')) || [];

// 2. Funciones de Interfaz (Modales y Carga)
function toggleModal(id) {
    const modal = document.getElementById(id);
    modal.classList.toggle('hidden');
}

window.onload = () => {
    // Cargar notas
    const guardadas = localStorage.getItem('notas_ingles');
    if (guardadas) document.getElementById('texto-notas').value = guardadas;
    
    // Opcional: Cargar historial previo de la IA al chat
    historial.forEach(chat => {
        agregarMensajeAlChat('Tú', chat.user, 'user');
        agregarMensajeAlChat('Teacher AI', chat.ai, 'ai');
    });
};

// 3. Palabra Random
function nuevaPalabra() {
    const wordElement = document.getElementById('random-word');
    const transElement = document.getElementById('random-translation');
    wordElement.style.opacity = 0;
    setTimeout(() => {
        const index = Math.floor(Math.random() * diccionario.length);
        wordElement.innerText = diccionario[index].eng;
        transElement.innerText = diccionario[index].esp;
        wordElement.style.opacity = 1;
    }, 200);
}

// 4. Notas
function guardarNotas() {
    const notas = document.getElementById('texto-notas').value;
    localStorage.setItem('notas_ingles', notas);
    alert('¡Notas guardadas!');
    toggleModal('modal-notas');
}

// 5. Lógica de Chat e IA
function enviarConsulta() {
    const input = document.getElementById('user-input');
    const mensaje = input.value.trim();
    if (!mensaje) return;

    agregarMensajeAlChat('Tú', mensaje, 'user');
    input.value = '';

    // Llamamos a la versión de la API
    conectarConIA(mensaje);
}

async function conectarConIA(mensajeUsuario) {
    const container = document.getElementById('chat-container');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = "loading-ai";
    loadingDiv.className = "text-xs text-violet-400 animate-pulse ml-auto mb-4";
    loadingDiv.innerText = "Teacher AI está escribiendo...";
    container.appendChild(loadingDiv);

    try {
        const respuesta = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "Sos un profesor de inglés..." },
                    ...historial.map(h => ({ role: "user", content: h.user })),
                    { role: "user", content: mensajeUsuario }
                ]
            })
        });

        const data = await respuesta.json();

        // 🛡️ VALIDACIÓN: Si la API devuelve un error, lo atrapamos acá
        if (data.error || !data.choices) {
            console.error("Error de la IA:", data);
            throw new Error(data.error?.message || "La IA no respondió correctamente");
        }

        const textoIA = data.choices[0].message.content;
        
        document.getElementById('loading-ai').remove();
        agregarMensajeAlChat('Teacher AI', textoIA, 'ai');

        historial.push({ user: mensajeUsuario, ai: textoIA });
        if(historial.length > 10) historial.shift();
        localStorage.setItem('historial_chat', JSON.stringify(historial));

    } catch (error) {
        if(document.getElementById('loading-ai')) document.getElementById('loading-ai').remove();
        console.error("Error:", error);
        agregarMensajeAlChat('Teacher AI', "Perdón, se me cortó el Wi-Fi. ¿Me repetís?", 'ai');
    }
}

function agregarMensajeAlChat(autor, texto, tipo) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    const esAI = tipo === 'ai';
    
    div.className = `${esAI ? 'bg-white/5 mr-auto' : 'bg-violet-600/40 ml-auto'} border border-white/10 rounded-2xl p-4 max-w-[85%] glass-focus mb-4 animate-in fade-in slide-in-from-bottom-2 w-fit shadow-lg`;    
    
    const contenidoProcesado = esAI ? marked.parse(texto) : texto;

    // Generamos un ID único para cada mensaje para poder copiarlo después
    const mensajeId = 'msg-' + Date.now();

    div.innerHTML = `
        <p class="${esAI ? 'text-aquamarine-400' : 'text-violet-400'} text-[10px] font-bold mb-1 uppercase tracking-wider">${autor}</p>
        <div id="${mensajeId}" class="prose prose-invert prose-sm max-w-none text-gray-200 leading-relaxed break-words">
            ${contenidoProcesado}
        </div>
        ${esAI ? `
            <div class="flex gap-4 mt-3 pt-2 border-t border-white/5">
                <button onclick="hablar(\`${texto.replace(/"/g, '&quot;')}\`)" class="text-gray-400 hover:text-aquamarine-400 transition-colors flex items-center gap-1 text-[10px]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.287a6 6 0 0 1 0 7.426M12 9l-4.293-4.293a1 1 0 0 0-1.707.707v13.172a1 1 0 0 0 1.707.707L12 15h3a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-3Z" />
                    </svg>
                    ESCUCHAR
                </button>
                <button onclick="copiarANotas('${mensajeId}')" class="text-gray-400 hover:text-violet-400 transition-colors flex items-center gap-1 text-[10px]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                    </svg>
                    COPIAR A NOTAS
                </button>
            </div>
        ` : ''}
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Lógica para copiar a tus notas de LocalStorage
function copiarANotas(id) {
    const textoACopiar = document.getElementById(id).innerText;
    const notasActuales = localStorage.getItem('notas_ingles') || "";
    const nuevasNotas = notasActuales + "\n\n--- Frase guardada ---\n" + textoACopiar;
    
    localStorage.setItem('notas_ingles', nuevasNotas);
    document.getElementById('texto-notas').value = nuevasNotas; // Actualiza el textarea si está abierto
    alert("¡Copiado a tus notas! 📝");
}

function hablar(texto) {
    // Limpiamos el texto de etiquetas HTML por si acaso
    const textoLimpio = texto.replace(/<[^>]*>?/gm, '');
    const mensaje = new SpeechSynthesisUtterance(textoLimpio);
    mensaje.lang = 'en-US'; // Voz en inglés
    mensaje.rate = 0.9;    // Un poquito más lento para que se entienda mejor
    window.speechSynthesis.speak(mensaje);
}

function manejarRacha() {
    const hoy = new Date().toDateString();
    const ultimaVez = localStorage.getItem('ultima_visita');
    let racha = parseInt(localStorage.getItem('racha_estudio')) || 0;

    if (ultimaVez !== hoy) {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);

        if (ultimaVez === ayer.toDateString()) {
            racha++;
        } else if (ultimaVez === null || new Date(ultimaVez) < ayer) {
            racha = 1; // Empezamos de nuevo o primera vez
        }
        
        localStorage.setItem('racha_estudio', racha);
        localStorage.setItem('ultima_visita', hoy);
    }
    
    // Mostramos la racha en el header (donde dice "Study Mode")
    const streakDisplay = document.querySelector('header span');
    if (streakDisplay) {
        streakDisplay.innerHTML = `Study <span class="text-aquamarine-400">Mode</span> ${racha > 0 ? '🔥 ' + racha : ''}`;
    }
}

// Llamamos a la racha cuando carga la página
window.addEventListener('load', manejarRacha);