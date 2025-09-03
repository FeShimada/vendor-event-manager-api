export interface MercadoPagoOrderRequest {
    type: string;
    external_reference: string;
    transactions: {
        payments: Array<{
            amount: string;
        }>;
    };
    config: {
        point?: {
            terminal_id: string;
        };
        qr?: {
            external_pos_id: string;
            mode?: string;
        };
    };
    total_amount?: string;
    items?: Array<{
        title: string;
        unit_price: string;
        quantity: number;
        unit_measure: string;
        external_code?: string;
    }>;
}

export interface MercadoPagoOrderResponse {
    id: string;
    external_reference: string;
    status: string;
    type_response?: {
        qr_data: string;
    };
}