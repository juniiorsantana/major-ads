export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export interface SuccessResponse<T> {
    data: T;
    meta?: unknown;
}
