"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var plugin_react_1 = require("@vitejs/plugin-react");
var path_1 = require("path");
var url_1 = require("url");
var __dirname = path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    resolve: {
        alias: {
            "@": path_1.default.resolve(__dirname, "client", "src"),
            "@shared": path_1.default.resolve(__dirname, "shared"),
            "@assets": path_1.default.resolve(__dirname, "attached_assets"),
        },
    },
    root: path_1.default.resolve(__dirname, "client"),
    build: {
        outDir: path_1.default.resolve(__dirname, "dist"),
        emptyOutDir: true,
    },
});
