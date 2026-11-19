export interface PaymentCard {
  cardNumber: string;
  cardHolder: string;
  /** MM/YY */
  expiry: string;
  cvv: string;
}

export interface PaymentRequest {
  amountMinor: number;
  currency: string;
  card: PaymentCard;
  /** Id de la reserva, para idempotencia/trazabilidad en la pasarela. */
  reference: string;
}

export type PaymentResult =
  | { approved: true; transactionId: string }
  | { approved: false; reason: string };

/** Adaptador simulado en el bloque 4. Los datos de tarjeta nunca se persisten ni se registran. */
export interface PaymentPort {
  charge(request: PaymentRequest): Promise<PaymentResult>;
}
