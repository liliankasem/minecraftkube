import * as rp from 'request-promise';
import * as uuid from 'uuid/v4';

import config = require("./config");

export class API {

    static endpoint = "https://challenget-team-25-f714a8mgmt.eastus.cloudapp.azure.com";
    static options = {
        method: null,
        insecure: true,
        rejectUnauthorized: false,
        json: true,
        uri: null,
        headers: {
            "Authorization": config.auth,
            "content-type": "application/json"
        },
        body: null
    };

    static async createPod(name: string) {

        let pod = {
            "apiVersion": "apps/v1beta1",
            "kind": "StatefulSet",
            "namespace": "minecraft",
            "metadata": {
                "name": "minecraft-pod-" + name,
                "labels": {
                    "app": "minecraft-" + name
                }
            },
            "spec": {
                "replicas": 1,
                "serviceName": "minecraft",
                "selector": {
                    "matchLabels": {
                        "app": "minecraft-" + name
                    }
                },
                "template": {
                    "metadata": {
                        "labels": {
                            "app": "minecraft-" + name
                        }
                    },
                    "spec": {
                        "restartPolicy": "Always",
                        "containers": [
                            {
                                "name": "challengetwo",
                                "imagePullPolicy": "Always",
                                "image": "openhack/minecraft-server:2.0",
                                "env": [
                                    {
                                        "name": "EULA",
                                        "value": "TRUE"
                                    }
                                ],
                                "ports": [
                                    {
                                        "containerPort": 25565
                                    },
                                    {
                                        "containerPort": 25575
                                    }
                                ],
                                "volumeMounts": [
                                    {
                                        "name": "datadir",
                                        "mountPath": "/data"
                                    }
                                ]
                            }
                        ]
                    }
                },
                "volumeClaimTemplates": [
                    {
                        "metadata": {
                            "name": "datadir"
                        },
                        "spec": {
                            "accessModes": [
                                "ReadWriteOnce"
                            ],
                            "storageClassName": "minecraft-storage-" + name,
                            "resources": {
                                "requests": {
                                    "storage": "1Gi"
                                }
                            }
                        }
                    }
                ]
            }
        };

        API.options.method = 'POST';
        API.options.uri = API.endpoint + "/apis/apps/v1beta1/namespaces/minecraft/statefulsets";
        API.options.body = pod;

        await rp(API.options)
            .then((body) => {
                console.log(body);
                return true;
            })
            .catch((err) => {
                console.log(err);
                return false;
            });
    }

    static async deletePod(name: string) {

        API.options.method = 'DELETE';
        API.options.uri = API.endpoint + "/apis/apps/v1beta1/namespaces/minecraft/statefulsets/" + name,

            await rp(API.options)
                .then((body) => {
                    console.log(body);
                    return true;
                })
                .catch((err) => {
                    console.log(err);
                    return false;
                });
    }

    static async createService(name: string) {
        let service = {
            "kind": "Service",
            "apiVersion": "v1",
            "namespace": "minecraft",
            "metadata": {
                "name": "minecraft-service-" + name
            },
            "spec": {
                "type": "LoadBalancer",
                "selector": {
                    "app": "minecraft-" + name
                },
                "ports": [
                    {
                        "name": "minecraft",
                        "port": 25565
                    },
                    {
                        "name": "rcon",
                        "port": 25575
                    }
                ]
            }
        };

        API.options.method = 'POST';
        API.options.uri = API.endpoint + "/api/v1/namespaces/minecraft/services",
            API.options.body = service;

        await rp(API.options)
            .then((body) => {
                console.log(body);
                return true;
            })
            .catch((err) => {
                console.log(err);
                return false;
            });


    }

    static async deleteService(name: string) {

        API.options.method = 'DELETE';
        API.options.uri = API.endpoint + "/api/v1/namespaces/minecraft/services/" + name,

            await rp(API.options)
                .then((body) => {
                    console.log(body);
                    return true;
                })
                .catch((err) => {
                    console.log(err);
                    return false;
                });
    }

    static async createStorage(name: string) {

        let storage = {
            "kind": "StorageClass",
            "namespace": "minecraft",
            "apiVersion": "storage.k8s.io/v1",
            "metadata": {
                "name": "minecraft-storage-" + name
            },
            "provisioner": "kubernetes.io/azure-disk",
            "parameters": {
                "storageaccounttype": "Standard_LRS",
                "kind": "Shared"
            }
        };

        API.options.method = 'POST';
        API.options.uri = API.endpoint + "/apis/storage.k8s.io/v1/storageclasses",
            API.options.body = storage;

        await rp(API.options)
            .then((body) => {
                console.log(body);
                return true;
            })
            .catch((err) => {
                console.log(err);
                return false;
            });
    }

    static async deleteStorage(name: string) {

        API.options.method = 'DELETE';
        API.options.uri = API.endpoint + "/apis/storage.k8s.io/v1/storageclasses/" + name,

            await rp(API.options)
                .then((body) => {
                    console.log(body);
                    return true;
                })
                .catch((err) => {
                    console.log(err);
                    return false;
                });
    }

    static async create(req, res) {

        let deploymentUUID = uuid();
        deploymentUUID = deploymentUUID.split('-');
        await API.createPod(deploymentUUID[0]);
        await API.createService(deploymentUUID[0]);
        await API.createStorage(deploymentUUID[0]);

        res.send("done");
    }

    static async list(req, res) {
        console.log(config.auth);
        API.options.method = 'GET';
        API.options.uri = API.endpoint + "/api/v1/namespaces/minecraft/services",

            await rp(API.options)
                .then((body) => {
                    let json = [];
                    body.items.forEach(element => {
                        let r = {
                            "name": element.metadata.name,
                            "endpoints": {
                                "minecraft": element.status.loadBalancer.ingress[0].ip + ":25565",
                                "rcon": element.status.loadBalancer.ingress[0].ip + ":25575"
                            }
                        };
                        json.push(r);
                        console.log(r);
                    });
                    res.send(json);
                })
                .catch((err) => {
                    console.log(err);
                });

    }

    static async delete(req, res) {

        await API.deletePod(req.body.pod);
        await API.deleteService(req.body.service);
        await API.deleteStorage(req.body.storage);

        res.send("done");

    }

}