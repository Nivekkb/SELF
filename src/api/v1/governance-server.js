"use strict";
/**
 * SELF Governance API Server
 *
 * This module creates an Express server for the governance API
 * and integrates it with the main SELF HTTP server.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGovernanceExpressApp = createGovernanceExpressApp;
exports.integrateGovernanceApiWithHttpServer = integrateGovernanceApiWithHttpServer;
exports.startStandaloneGovernanceServer = startStandaloneGovernanceServer;
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var governance_1 = require("./governance");
function createGovernanceExpressApp() {
    var app = (0, express_1.default)();
    // Middleware
    app.use(body_parser_1.default.json({ limit: '10mb' }));
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    // CORS headers
    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
        next();
    });
    // Health check endpoint
    app.get('/health', function (req, res) {
        res.json({
            status: 'healthy',
            service: 'self-governance-api',
            version: '1.0.0',
            timestamp: new Date().toISOString()
        });
    });
    // API version prefix
    var apiRouter = express_1.default.Router();
    app.use('/api/v1', apiRouter);
    // Mount governance router
    var governanceRouter = (0, governance_1.createGovernanceRouter)();
    apiRouter.use('/governance', governanceRouter);
    // API documentation endpoint
    apiRouter.get('/', function (req, res) {
        res.json({
            service: 'SELF Governance API',
            version: '1.0.0',
            endpoints: {
                submitRequest: 'POST /api/v1/governance/requests',
                getRequestStatus: 'GET /api/v1/governance/requests/{id}',
                listRequests: 'GET /api/v1/governance/requests',
                health: 'GET /health'
            },
            documentation: 'See SELF Governance API documentation for detailed usage'
        });
    });
    return app;
}
function integrateGovernanceApiWithHttpServer(server, governanceApp) {
    // Store the governance app on the server object for later use
    server.__governanceApp = governanceApp;
    // Override the server's request listener to handle both original and governance routes
    var originalRequestListener = server.listeners('request')[0];
    server.removeAllListeners('request');
    server.on('request', function (req, res) {
        // Check if this is a governance API request
        var url = req.url || '';
        if (url.startsWith('/api/v1/governance') || url.startsWith('/health')) {
            // Handle with Express governance app
            governanceApp(req, res);
        }
        else {
            // Handle with original SELF HTTP server
            originalRequestListener(req, res);
        }
    });
}
function startStandaloneGovernanceServer(port) {
    if (port === void 0) { port = 3001; }
    var app = createGovernanceExpressApp();
    var server = app.listen(port, function () {
        console.log("SELF Governance API server running on port ".concat(port));
        console.log("Health check: http://localhost:".concat(port, "/health"));
        console.log("API docs: http://localhost:".concat(port, "/api/v1"));
    });
    return server;
}
