import app from "./app";
import { loadEnv } from "./config/env";

const { PORT } = loadEnv();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
