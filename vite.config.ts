import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()],server:process.env.TEMPLE_TRIAL_PROXY==='1'?{allowedHosts:process.env.TRIAL_PUBLIC_HOST?[process.env.TRIAL_PUBLIC_HOST]:[],proxy:{'/api/temple':{target:'http://127.0.0.1:3002'},'/socket.io':{target:'http://127.0.0.1:3002',ws:true}}}:undefined });
