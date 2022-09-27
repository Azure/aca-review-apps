"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskParameters = void 0;
const core = __importStar(require("@actions/core"));
class TaskParameters {
    constructor(endpoint) {
        this._subscriptionId = endpoint.subscriptionID;
        // Required basic parameters
        this._resourceGroup = core.getInput('resource-group', { required: true });
        this._containerAppName = core.getInput('name', { required: true });
        this._imageName = core.getInput('image', { required: true });
        this._revisionNameSuffix = core.getInput('revision-name-suffix', { required: false });
        // Optional Dapr parameters
        this._daprAppPort = parseInt(core.getInput('dapr-app-port', { required: false }));
        this._daprAppProtocol = core.getInput('dapr-app-protocol', { required: false });
        this._daprEnabled = core.getInput('dapr-enabled', { required: false }) == "true";
        // Optional ingress parameters
        this._ingressExternal = core.getInput('ingress-external', { required: false }) == "true";
        this._ingressTargetPort = parseInt(core.getInput('ingress-target-port', { required: false }));
        const ingressTrafficJsonString = core.getInput('ingress-traffic-json', { required: false });
        this._ingressTraffic = ingressTrafficJsonString == "" ? [] : JSON.parse(ingressTrafficJsonString);
        // Optional scale parameters
        this._scaleMaxReplicas = parseInt(core.getInput('scale-max-replicas', { required: false }));
        this._scaleMinReplicas = parseInt(core.getInput('scale-min-replicas', { required: false }));
        // Optional mode parameter
        this._deactivateRevisionMode = core.getInput('deactivate-revision-mode', { required: false }) == "true";
    }
    static getTaskParams(endpoint) {
        if (!this.taskparams) {
            this.taskparams = new TaskParameters(endpoint);
        }
        return this.taskparams;
    }
    // Required base parameters
    get resourceGroup() {
        return this._resourceGroup;
    }
    get containerAppName() {
        return this._containerAppName;
    }
    get imageName() {
        return this._imageName;
    }
    get revisionNameSuffix() {
        return this._revisionNameSuffix;
    }
    get subscriptionId() {
        return this._subscriptionId;
    }
    // Optional Dapr parameters
    get daprAppPort() {
        return this._daprAppPort;
    }
    get daprAppProtocol() {
        return this._daprAppProtocol;
    }
    get daprEnabled() {
        return this._daprEnabled;
    }
    // Optional Ingress parameters
    get ingressExternal() {
        return this._ingressExternal;
    }
    get ingressTargetPort() {
        return this._ingressTargetPort;
    }
    get ingressTraffic() {
        return this._ingressTraffic;
    }
    // Optional scale parameters
    get scaleMaxReplicas() {
        return this._scaleMaxReplicas;
    }
    get scaleMinReplicas() {
        return this._scaleMinReplicas;
    }
    get deactivateRevisionMode() {
        return this._deactivateRevisionMode;
    }
}
exports.TaskParameters = TaskParameters;
//# sourceMappingURL=taskparameters.js.map