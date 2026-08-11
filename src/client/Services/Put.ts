/**
 * Client-side HTTP PUT service
 * @module Client/Services/Put
 * @description Browser-only service using Fetch API (DOM)
 * This file should only be used in client/browser context, not in Node.js/Azure Functions
 */

export default async function Put(
    url: string,
    body: Record<string, unknown>,
    headers: Record<string, unknown> = {}
): Promise<any> {
    try {
        // Using browser's Fetch API - Response type from DOM lib
        const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
            body: JSON.stringify(body)
        });
        return response.json();
    } catch (e) {
        throw new Error(e);
    }
}
