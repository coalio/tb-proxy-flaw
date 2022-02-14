"use strict";

const net = require("net");
const DUMMY_SERVER_IP = "5.9.123.159";

class Middleware {
    constructor(port, clientSocket, sandbox) {
        this.onData = this.onData.bind(this);
        this.onError = this.onError.bind(this);
        this.sendPacket = this.sendPacket.bind(this);

        this.port = port;
        this.sandbox = sandbox;
        this.clientSocket = clientSocket;

        this.newServerSocket();
        this.clientSocket.on("error", this.onError);
    }

    async newServerSocket() {
        this.socket = new net.Socket();
        this.socket.connect(this.port, DUMMY_SERVER_IP);
        this.socket.on("data", this.onData);
        this.socket.on("error", this.onError);
    }

    sendPacket(packet) {
        console.log("Sending >> ", packet.toString());
        this.socket.write(packet);
    }

    onData(data) {
        // Forward this data to the client's socket
        const command = data.toString();
        if (
            command.includes("WHISPER") &&
            command.includes(this.sandbox.username)
        ) {
            return;
        }

        console.log("Forwarding << ", data.toString());
        this.clientSocket.write(data);
    }

    onError() {
        console.log("Socket with the server died. Port: " + this.port);
        this.socket.removeAllListeners();
        this.socket.destroy();
    }
}

module.exports = Middleware;
