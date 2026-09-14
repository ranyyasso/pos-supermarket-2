import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./e2e',
  workers:4,
  use:{baseURL:'http://127.0.0.1:18174',viewport:{width:1366,height:768},trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'npm run dev -- --host 127.0.0.1 --port 18174',url:'http://127.0.0.1:18174',reuseExistingServer:true},
  fullyParallel:true,
});
