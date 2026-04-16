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
    
    div.className = `${esAI ? 'bg-white/5 ml-auto' : 'bg-violet-600/20 mr-auto'} border border-white/10 rounded-2xl p-5 max-w-[85%] glass-focus mb-4 animate-in fade-in slide-in-from-bottom-2 overflow-x-auto`;
    
    // Aquí es donde sucede la magia:
    // Si es la IA, parseamos el Markdown. Si es el usuario, texto plano.
    const contenidoProcesado = esAI ? marked.parse(texto) : texto;

    div.innerHTML = `
        <p class="${esAI ? 'text-aquamarine-400' : 'text-violet-400'} text-xs font-bold mb-1">${autor}</p>
        <div class="prose prose-invert prose-sm max-w-none text-gray-200 leading-relaxed">
            ${contenidoProcesado}
        </div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}