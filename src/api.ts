import * as rp from 'request-promise';
import * as uuid from 'uuid/v4';

export class API {

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

        const options = {
            method: 'POST',
            uri: "http://localhost:8001/apis/apps/v1beta1/namespaces/minecraft/statefulsets",
            json: true,
            headers: {
                "content-type": "application/json"
            },
            body: pod
        };

        await rp(options)
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

        const options = {
            method: 'DELETE',
            uri: "http://localhost:8001/apis/apps/v1beta1/namespaces/minecraft/statefulsets/" + name,
            json: true,
            headers: {
                "content-type": "application/json"
            }
        };

        await rp(options)
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

        const options = {
            method: 'POST',
            uri: "http://localhost:8001/api/v1/namespaces/minecraft/services",
            json: true,
            headers: {
                "content-type": "application/json"
            },
            body: service
        };

        await rp(options)
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


        const options = {
            method: 'DELETE',
            uri: "http://localhost:8001/api/v1/namespaces/minecraft/services/" + name,
            json: true,
            headers: {
                "content-type": "application/json"
            }
        };

        await rp(options)
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

        const options = {
            method: 'POST',
            uri: "http://localhost:8001/apis/storage.k8s.io/v1/storageclasses",
            json: true,
            headers: {
                "content-type": "application/json"
            },
            body: storage
        };

        await rp(options)
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

        const options = {
            method: 'DELETE',
            uri: "http://localhost:8001/apis/storage.k8s.io/v1/storageclasses/" + name,
            json: true,
            headers: {
                "content-type": "application/json"
            }
        };

        await rp(options)
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
        const options = {
            method: 'GET',
            uri: "http://localhost:8001/api/v1/namespaces/minecraft/services",
            json: true,
            headers: {
                "content-type": "application/json"
            }
        };

        await rp(options)
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