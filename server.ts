import app from './app';
import { envVars } from './src/config/env';

const PORT = envVars.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});