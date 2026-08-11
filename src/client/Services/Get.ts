/**
 * Client-side HTTP GET service
 * @module Client/Services/Get
 * @description Browser-only service using Fetch API (DOM)
 * This file should only be used in client/browser context, not in Node.js/Azure Functions
 */

export default async function Get(
    url: string,
    headers: Record<string, unknown> = {}
): Promise<any> {
    try {
        // Using browser's Fetch API - Response type from DOM lib
        const response: Response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
        });
        return response.json();
    } catch (e) {
        throw new Error(e);
    }
}
