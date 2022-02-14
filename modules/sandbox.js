"use strict";
const net = require("net");
const Middleware = require("./middleware");

class Sandbox {
    constructor(port) {
        this.onData = this.onData.bind(this);
        this.onError = this.onError.bind(this);
        this.onConnection = this.onConnection.bind(this);
        this.config = {
            fping: false,
            dont_forward_rtg: false,
            ping_interval: true,
        };

        this.port = port;
        this.connected = false;
        this.resume_packets = [];
        this.avoid_ping_interval = setInterval(() => {
            if (
                this.connected &&
                this.config.ping_interval &&
                this.config.fping &&
                this.username
            ) {
                this.middleware.sendPacket(
                    this.asBuffer(
                        `whisper ${this.username} note: dont lose focus\n`
                    )
                );
            }
        }, 5000);

        this.server = net
            .createServer((socket) => {
                socket.on("data", this.onData);
            })
            .on("connection", this.onConnection)
            .on("error", this.onError)
            .listen(port);
    }

    onConnection(socket) {
        this.socket = socket;
        console.log("Connection established at port", this.port);
        this.middleware = new Middleware(this.port, socket, this);
    }

    async onData(data) {
        const command = data.toString();
        this.forwardPacket(data, command);
    }

    forwardPacket(data, packet) {
        if (packet.match(/^fping/)) {
            this.config.fping = !this.config.fping;
            this.announceSocket(
                `force-ping is now ${
                    this.config.fping ? "enabled" : "disabled"
                }.`,
                true
            );

            if (!this.config.ping_interval) {
                this.announceSocket("^03avoid-autoping is disabled.", true);
            }

            return;
        } else if (packet.match(/^deny-rtg/)) {
            this.dont_forward_rtg = !this.dont_forward_rtg;
            this.announceSocket(
                `deny-rtg is now ${
                    this.dont_forward_rtg ? "disabled" : "enabled"
                }.`,
                true
            );
            return;
        } else if (packet.match(/^avoid-autoping/)) {
            this.config.ping_interval = !this.config.ping_interval;
            this.announceSocket(
                `avoid-autoping is now ${
                    this.config.ping_interval ? "enabled" : "disabled"
                }.`,
                true
            );
            return;
        }

        if (this.config.fping) {
            if (packet.startsWith("JOINT") || packet.startsWith("GRIP")) {
                // Add to resume_packets
                this.resume_packets.push(packet);
                return;
            } else if (packet.startsWith("fping-resume")) {
                // Send packets
                this.resume_packets.forEach((p) => {
                    this.middleware.sendPacket(this.asBuffer(p));
                });
                this.resume_packets = [];

                return;
            }
        }

        this.middleware.sendPacket(data);
    }

    onError() {
        console.log("Port died:", this.port);
    }

    hex(str) {
        return Buffer.from(str, "utf8").toString("hex");
    }

    asBuffer(str) {
        return Buffer.from(this.hex(str), "hex");
    }

    announceSocket(str, includePrefix = false) {
        this.socket.write(
            `SAY 0; ^71*${includePrefix ? " Proxy:" : ""}^87 ${str}\n`
        );
    }
}

module.exports = Sandbox;
