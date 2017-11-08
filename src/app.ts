"use strict";

import * as path from "path";
import * as express from "express";
import * as bodyParser from "body-parser";

import { API } from './api';

class App {

    public server: express.Application;

    constructor() {
        this.server = express();
        this.config();
    }

    config() {
        const router = express.Router()

        router.get('/', (req, res) => {
            res.json({
                message: 'Hello World!'
            })
        })

        router.get('/list', API.list);
        router.post('/create', API.create);
        router.delete('/delete', API.delete);

        this.server.use(bodyParser.json());
        this.server.use('/', router);


        // Setup Express Server
        this.server.listen(process.env.port || process.env.PORT || 3978, '::', () => {
            console.log('Server Up');
        });
    }
}

export default new App().server;