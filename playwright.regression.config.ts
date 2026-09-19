import {defineConfig} from '@playwright/test';
import base from './playwright.config';
// A production preview avoids HMR reloads when regression tests write QA artifacts.
export default defineConfig({...base,use:{...base.use,baseURL:'http://127.0.0.1:18177'},webServer:{command:'npm run preview -- --host 127.0.0.1 --port 18177 --strictPort',url:'http://127.0.0.1:18177',reuseExistingServer:false}});
