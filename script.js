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
    // Mostramos un indicador de carga simple
    const container = document.getElementById('chat-container');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = "loading-ai";
    loadingDiv.className = "text-xs text-violet-400 animate-pulse ml-auto mb-4";
    loadingDiv.innerText = "Teacher AI está escribiendo...";
    container.appendChild(loadingDiv);

    try {
        const respuesta = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { 
                        role: "system", 
                        content: "Sos un profesor de inglés para una chica de Buenos Aires. Usá ejemplos de café, gatos y vida cotidiana porteña. NO hables de código, programación ni finanzas. Si te pide tablas o comparaciones, usá etiquetas HTML <table> con clases de Tailwind (border, p-2, etc.). Respondé de forma concisa y con onda." 
                    },
                    ...historial.map(h => ({ role: "user", content: h.user })), // Le damos memoria
                    { role: "user", content: mensajeUsuario }
                ]
            })
        });

        const data = await respuesta.json();
        const textoIA = data.choices[0].message.content;
        
        // Quitar indicador de carga y mostrar respuesta
        document.getElementById('loading-ai').remove();
        agregarMensajeAlChat('Teacher AI', textoIA, 'ai');

        // Guardar en historial
        historial.push({ user: mensajeUsuario, ai: textoIA });
        if(historial.length > 10) historial.shift(); // Limitar memoria para no saturar la API
        localStorage.setItem('historial_chat', JSON.stringify(historial));

    } catch (error) {
        document.getElementById('loading-ai').remove();
        console.error("Error:", error);
        agregarMensajeAlChat('Teacher AI', "Perdón, se me cortó el Wi-Fi en el café. ¿Me repetís?", 'ai');
    }
}

function agregarMensajeAlChat(autor, texto, tipo) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    const esAI = tipo === 'ai';
    
    div.className = `${esAI ? 'bg-white/5 ml-auto' : 'bg-violet-600/20 mr-auto'} border border-white/10 rounded-2xl p-5 max-w-[85%] glass-focus mb-4 animate-in fade-in slide-in-from-bottom-2`;
    
    div.innerHTML = `
        <p class="${esAI ? 'text-aquamarine-400' : 'text-violet-400'} text-xs font-bold mb-1">${autor}</p>
        <div class="text-gray-200 text-sm leading-relaxed">${texto}</div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}