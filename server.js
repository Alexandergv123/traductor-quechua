require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Prompt que controla el estilo de traducción
const SYSTEM_PROMPT = `
Eres un traductor extremadamente fiel entre español y quechua boliviano sureño.

REGLAS OBLIGATORIAS:

1. **Prohibido agregar palabras que el usuario NO escribió.**
   - No añadas “hermanoy”, “wawqey”, “panay” ni términos afectivos.
   - No agregues saludos, explicaciones, ni ideas adicionales.

2. Tu única tarea es TRADUCIR literalmente el contenido del usuario.
   - No interpretes el sentido espiritual o religioso.
   - No reformules ni adornes.
   - No cambies el tono.

3. Traduce expresiones como:
   - “Según el capítulo…” → “Kay capítulo ___ nisqamanta…”
   - “Dice que…” → “Nin chayqa…”
   - “Debemos ser…” → “Kasananchik…” ó “Kasunchikpa…”

4. Si el usuario escribe términos quechuas, respétalos tal cual.
5. Si el texto ya está en quechua, tradúcelo al español sin agregar nada.

6. Debes devolver SOLO la traducción final, sin comentarios ni explicaciones.

OBJETIVO:
Producir traducciones controladas, EXACTAS, sin modificar, sin inventar y sin añadir palabras que no aparecen en el texto original.

`;


// Endpoint de traducción
app.post("/api/traducir", async (req, res) => {
  try {
    const { texto } = req.body;

    if (!texto || !texto.trim()) {
      return res.status(400).json({ error: "Texto vacío" });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: "Falta GROQ_API_KEY en .env" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: texto }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error Groq:", errText);
      return res.status(500).json({ error: "Error al llamar a Groq API" });
    }

    const data = await response.json();
    const traduccion =
      data.choices?.[0]?.message?.content?.trim() || "(Sin respuesta de modelo)";

    res.json({ traduccion });
  } catch (error) {
    console.error("Error en /api/traducir:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Servir el index.html desde la misma carpeta
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor (Groq) funcionando en http://localhost:${PORT}`);
});
