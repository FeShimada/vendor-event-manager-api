export interface WebhookBody {
    action: string;
    api_version: string;
    application_id: string;
    data: {
        external_reference: string;
        id: string;
        status: string;
        status_detail: string;
        transactions?: {
            payments?: Array<{
                amount: string;
                id: string;
                status: string;
                status_detail: string;
            }>;
        };
        type: string;
        version: number;
    };
    date_created: string;
    live_mode: boolean;
    type: string;
    user_id: string;
} 