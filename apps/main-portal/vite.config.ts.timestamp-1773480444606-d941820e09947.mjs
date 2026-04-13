// vite.config.ts
import { defineConfig } from "file:///C:/project/faithportal/apps/main-portal/node_modules/vite/dist/node/index.js";
import react from "file:///C:/project/faithportal/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 5e3,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      },
      "^/admin.*": {
        target: "http://localhost:4000",
        changeOrigin: true
      },
      "^/app/calculator.*": {
        target: "http://localhost:5010",
        changeOrigin: true
      },
      "^/app/text-checker.*": {
        target: "http://localhost:5011",
        changeOrigin: true
      },
      "^/app/tetris.*": {
        target: "http://localhost:5012",
        changeOrigin: true
      },
      "^/app/sudoku.*": {
        target: "http://localhost:5013",
        changeOrigin: true
      },
      "^/app/pyeong-calc.*": {
        target: "http://localhost:5014",
        changeOrigin: true
      },
      "^/app/2048.*": {
        target: "http://localhost:5015",
        changeOrigin: true
      },
      "^/app/minesweeper.*": {
        target: "http://localhost:5016",
        changeOrigin: true
      },
      "^/app/age-calc.*": {
        target: "http://localhost:5017",
        changeOrigin: true
      },
      "^/app/dday-calc.*": {
        target: "http://localhost:5018",
        changeOrigin: true
      },
      "^/app/news.*": {
        target: "http://localhost:5001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/app\/news/, "")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxwcm9qZWN0XFxcXGZhaXRocG9ydGFsXFxcXGFwcHNcXFxcbWFpbi1wb3J0YWxcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHByb2plY3RcXFxcZmFpdGhwb3J0YWxcXFxcYXBwc1xcXFxtYWluLXBvcnRhbFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovcHJvamVjdC9mYWl0aHBvcnRhbC9hcHBzL21haW4tcG9ydGFsL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gICAgcGx1Z2luczogW3JlYWN0KCkgYXMgYW55XSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICAgIHBvcnQ6IDUwMDAsXHJcbiAgICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcclxuICAgICAgICBwcm94eToge1xyXG4gICAgICAgICAgICAnL2FwaSc6IHtcclxuICAgICAgICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NDAwMCcsXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICdeL2FkbWluLionOiB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjQwMDAnLFxyXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAnXi9hcHAvY2FsY3VsYXRvci4qJzoge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDEwJyxcclxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAnXi9hcHAvdGV4dC1jaGVja2VyLionOiB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjUwMTEnLFxyXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICdeL2FwcC90ZXRyaXMuKic6IHtcclxuICAgICAgICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAxMicsXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgJ14vYXBwL3N1ZG9rdS4qJzoge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDEzJyxcclxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAnXi9hcHAvcHllb25nLWNhbGMuKic6IHtcclxuICAgICAgICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAxNCcsXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgJ14vYXBwLzIwNDguKic6IHtcclxuICAgICAgICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAxNScsXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgJ14vYXBwL21pbmVzd2VlcGVyLionOiB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjUwMTYnLFxyXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICdeL2FwcC9hZ2UtY2FsYy4qJzoge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDE3JyxcclxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAnXi9hcHAvZGRheS1jYWxjLionOiB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjUwMTgnLFxyXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICdeL2FwcC9uZXdzLionOiB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjUwMDEnLFxyXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwcFxcL25ld3MvLCAnJyksXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlULFNBQVMsb0JBQW9CO0FBQzlVLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTLENBQUMsTUFBTSxDQUFRO0FBQUEsRUFDeEIsUUFBUTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osT0FBTztBQUFBLE1BQ0gsUUFBUTtBQUFBLFFBQ0osUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2xCO0FBQUEsTUFDQSxhQUFhO0FBQUEsUUFDVCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDbEI7QUFBQSxNQUNBLHNCQUFzQjtBQUFBLFFBQ2xCLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNsQjtBQUFBLE1BQ0Esd0JBQXdCO0FBQUEsUUFDcEIsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2xCO0FBQUEsTUFDQSxrQkFBa0I7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNsQjtBQUFBLE1BQ0Esa0JBQWtCO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDbEI7QUFBQSxNQUNBLHVCQUF1QjtBQUFBLFFBQ25CLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNsQjtBQUFBLE1BQ0EsZ0JBQWdCO0FBQUEsUUFDWixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDbEI7QUFBQSxNQUNBLHVCQUF1QjtBQUFBLFFBQ25CLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNsQjtBQUFBLE1BQ0Esb0JBQW9CO0FBQUEsUUFDaEIsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2xCO0FBQUEsTUFDQSxxQkFBcUI7QUFBQSxRQUNqQixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDbEI7QUFBQSxNQUNBLGdCQUFnQjtBQUFBLFFBQ1osUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLGdCQUFnQixFQUFFO0FBQUEsTUFDdEQ7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
