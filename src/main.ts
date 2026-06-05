import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

// 清理 HMR 遗留的 portal 浮层（旧版 PhaseOverlay 挂到 body 未卸载）
document.querySelectorAll('body > .phase-overlay, body > .phase-toast').forEach((node) => {
  node.remove();
});

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
