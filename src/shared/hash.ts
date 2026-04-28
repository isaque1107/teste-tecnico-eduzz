import crypto from "crypto";

export function hashDocument(document: string): string {
    return crypto.createHash("sha256").update(document.replace(/\D/g, "")).digest("hex");
}