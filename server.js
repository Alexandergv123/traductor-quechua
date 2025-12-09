require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Prompt que controla el estilo de traducción
const SYSTEM_PROMPT = `
Eres un traductor experto entre ESPAÑOL y QUECHUA BOLIVIANO CASTELLANIZADO (estilo JW).

Reglas:
- Traduce de manera fiel, respetando el sentido original.
- No agregues ideas, no interpretes significados ocultos.
- No cambies palabras por conceptos como “propósito”, “provisión espiritual”, etc.
- Mantén un estilo natural y respetuoso, similar al usado en publicaciones de JW.
- Si el texto está en español, tradúcelo al quechua castellanizado.
- Si el texto está en quechua castellanizado, tradúcelo al español.
- Usa expresiones usadas en tu corpus: imaynalla, hermanoy, wawquey, kusisqa, yanapaynin, etc.
- La traducción debe sonar natural, pero siempre fiel al contenido original.
- No expliques lo que haces. Devuelve solo la traducción.
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
