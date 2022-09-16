import * as core from '@actions/core';
import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer";

export class TaskParameters {
    private static taskparams: TaskParameters;

    // Required basic parameters
    private _resourceGroup: string;
    private _containerAppName: string;
    private _imageName: string;
    private _revisionNameSuffix: string;
    private _subscriptionId: string;

    // Optional Dapr parameters
    private _daprEnabled: boolean;
    private _daprAppPort: number;
    private _daprAppProtocol: string;

    // Optional Ingress parameters
    private _ingressExternal: boolean;
    private _ingressTargetPort: number;
    private _ingressTraffic: any[];

    // Optional scale parameters
    private _scaleMaxReplicas: number;
    private _scaleMinReplicas: number;

    // Optional mode parameter
    private _deactivateRevisionMode: boolean;

    private constructor(endpoint: IAuthorizer) {

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
        let ingressTrafficJsonString = core.getInput('ingress-traffic-json', { required: false });
        this._ingressTraffic = ingressTrafficJsonString == "" ? [] : JSON.parse(ingressTrafficJsonString)

        // Optional scale parameters
        this._scaleMaxReplicas = parseInt(core.getInput('scale-max-replicas', { required: false }));
        this._scaleMinReplicas = parseInt(core.getInput('scale-min-replicas', { required: false }));

        // Optional mode parameter
        this._deactivateRevisionMode = core.getInput('deactivate-revision-mode', { required: false }) == "true";
    }

    public static getTaskParams(endpoint: IAuthorizer) {
        if (!this.taskparams) {
            this.taskparams = new TaskParameters(endpoint);
        }
        return this.taskparams;
    }

    // Required base parameters
    public get resourceGroup() {
        return this._resourceGroup;
    }

    public get containerAppName() {
        return this._containerAppName;
    }

    public get imageName() {
        return this._imageName;
    }

    public get revisionNameSuffix() {
        return this._revisionNameSuffix;
    }

    public get subscriptionId() {
        return this._subscriptionId;
    }

    // Optional Dapr parameters
    public get daprAppPort() {
        return this._daprAppPort;
    }

    public get daprAppProtocol() {
        return this._daprAppProtocol;
    }

    public get daprEnabled() {
        return this._daprEnabled;
    }

    // Optional Ingress parameters
    public get ingressExternal() {
        return this._ingressExternal;
    }

    public get ingressTargetPort() {
        return this._ingressTargetPort;
    }

    public get ingressTraffic() {
        return this._ingressTraffic;
    }

    // Optional scale parameters
    public get scaleMaxReplicas() {
        return this._scaleMaxReplicas;
    }

    public get scaleMinReplicas() {
        return this._scaleMinReplicas;
    }

    public get deactivateRevisionMode() {
        return this._deactivateRevisionMode;
    }
}