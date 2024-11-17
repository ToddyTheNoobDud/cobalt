import ipaddr from "ipaddr.js";


import { randomBytes } from "crypto";
import { createStream } from "../stream/manage.js";
import { apiSchema } from "./schema.js";

const generateRandomIP = () => {
    // Choose a random private IP range or common ISP range
    const privateIPRanges = [
        { start: "10.0.0.0", end: "10.255.255.255" },      // Class A
        { start: "172.16.0.0", end: "172.31.255.255" },    // Class B
        { start: "192.168.0.0", end: "192.168.255.255" }   // Class C
    ];

    const randomRange = privateIPRanges[Math.floor(Math.random() * privateIPRanges.length)];

    const start = ipaddr.parse(randomRange.start);
    const end = ipaddr.parse(randomRange.end);

    const randomIPBytes = start.octets.map((byte, index) => {
        return byte + Math.floor(Math.random() * (end.octets[index] - byte + 1)); // Generate bytes within the range
    });

    return ipaddr.fromByteArray(randomIPBytes).toString();
}
export function createResponse(responseType, responseData) {
    const internalError = (code) => {
        return {
            status: 500,
            body: {
                status: "error",
                error: {
                    code: code || "error.api.fetch.critical",
                },
                critical: true
            }
        }
    }

    try {
        let status = 200,
            response = {};

        if (responseType === "error") {
            status = 400;
        }

        switch (responseType) {
            case "error":
                response = {
                    error: {
                        code: responseData?.code,
                        context: responseData?.context,
                    }
                }
                break;

            case "redirect":
                response = {
                    url: responseData?.url,
                    filename: responseData?.filename
                }
                break;

            case "tunnel":
                response = {
                    url: createStream(responseData),
                    filename: responseData?.filename
                }
                break;

            case "picker":
                response = {
                    picker: responseData?.picker,
                    audio: responseData?.url,
                    audioFilename: responseData?.filename
                }
                break;

            case "critical":
                return internalError(responseData?.code);

            default:
                throw "unreachable"
        }

        return {
            status,
            body: {
                status: responseType,
                ...response
            }
        }
    } catch {
        return internalError()
    }
}

export function normalizeRequest(request) {
    return apiSchema.safeParseAsync(request).catch(() => (
        { success: false }
    ));
}

export function getIP() {
    return generateRandomIP();
}

