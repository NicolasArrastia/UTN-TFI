import app from "./app.ts";
import { env } from "./config/env.ts";

app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port}`);
});
