import "dotenv/config";
import "@/db/db.js" // inicializa el pool y prueba la conexión al arrancar
import app from "./app.js";

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

