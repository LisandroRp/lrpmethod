import crypto from "node:crypto";
import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";

function getAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN");
  }

  return token;
}

function createClient(accessToken: string) {
  return new MercadoPagoConfig({
    accessToken
  });
}

export async function getPreapprovalById(id: string) {
  const preapproval = new PreApproval(createClient(getAccessToken()));
  return preapproval.get({ id });
}

export async function createPendingPreapproval(body: Record<string, unknown>) {
  const preapproval = new PreApproval(createClient(getAccessToken()));
  const idempotencyKey =
    typeof body.external_reference === "string" && body.external_reference.trim()
      ? body.external_reference.trim()
      : crypto.randomUUID();

  return preapproval.create({
    body: body as never,
    requestOptions: {
      idempotencyKey
    }
  });
}

export async function getPaymentById(id: string) {
  const payment = new Payment(createClient(getAccessToken()));
  return payment.get({ id });
}

export async function cancelPreapprovalById(id: string) {
  const preapproval = new PreApproval(createClient(getAccessToken()));
  return preapproval.update({
    id,
    body: {
      status: "cancelled"
    } as never
  });
}
