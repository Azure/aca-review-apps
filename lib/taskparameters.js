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
    constructor() {
        // Required basic parameters
        this._subscriptionId = core.getInput('subscription-id', { required: true });
        this._resourceGroup = core.getInput('resource-group', { required: true });
        this._containerAppName = core.getInput('name', { required: true });
        this._location = core.getInput('location', { required: true });
        this._managedEnvironmentName = core.getInput('managed-environment-name', { required: true });
        // Optional Dapr parameters
        this._daprAppPort = parseInt(core.getInput('dapr-app-port', { required: false }));
        this._daprAppProtocol = core.getInput('dapr-app-protocol', { required: false });
        this._daprEnabled = core.getInput('dapr-enabled', { required: false }) == "true";
        // Optional ingress parameters
        this._ingressExternal = core.getInput('ingress-external', { required: false }) == "true";
        this._ingressTargetPort = parseInt(core.getInput('ingress-target-port', { required: false }));
        let ingressCustomDomainsJsonString = core.getInput('ingress-custom-domains-json', { required: false });
        this._ingressCustomDomains = JSON.parse(ingressCustomDomainsJsonString);
        let ingressTrafficJsonString = core.getInput('ingress-traffic-json', { required: false });
        this._ingressTraffic = JSON.parse(ingressTrafficJsonString);
        // Optional scale parameters
        this._scaleMaxReplicas = parseInt(core.getInput('scale-max-replicas', { required: false }));
        this._scaleMinReplicas = parseInt(core.getInput('scale-min-replicas', { required: false }));
        let scaleRulesJsonString = core.getInput('scale-rules-json', { required: false });
        this._scaleRules = JSON.parse(scaleRulesJsonString);
        // Required container config parameters
        let containerConfigJsonString = core.getInput('containers-config-json', { required: true });
        this._containersConfig = JSON.parse(containerConfigJsonString);
    }
    // JSON Validation
    // TBD: Need to validate that the specific params for ingressDomains exist in the input json
    // TBD: Need to validate that the specific params for ingressTraffic exist in the input json
    // TBD: Need to validate that the specific params for scaleRules exist in the input json
    // TBD: Need to validate that the specific params for containersConfig like 'name' and 'image' exist in the input json
    static getTaskParams() {
        if (!this.taskparams) {
            this.taskparams = new TaskParameters();
        }
        return this.taskparams;
    }
    // Required basic parameters
    get resourceGroup() {
        return this._resourceGroup;
    }
    get containerAppName() {
        return this._containerAppName;
    }
    get location() {
        return this._location;
    }
    get subscriptionId() {
        return this._subscriptionId;
    }
    get managedEnvironmentName() {
        return this._managedEnvironmentName;
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
    get ingressCustomDomains() {
        return this._ingressCustomDomains;
    }
    // Optional scale parameters
    get scaleMaxReplicas() {
        return this._scaleMaxReplicas;
    }
    get scaleMinReplicas() {
        return this._scaleMinReplicas;
    }
    get scaleRules() {
        return this._scaleRules;
    }
    // Required container config parameters
    get containersConfig() {
        return this._containersConfig;
    }
}
exports.TaskParameters = TaskParameters;
