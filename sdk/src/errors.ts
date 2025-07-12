export class NeX7Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NeX7Error';
  }
}

export class NeX7APIError extends NeX7Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'NeX7APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NeX7RateLimitError extends NeX7APIError {
  public readonly limit: number;
  public readonly remaining: number;
  public readonly reset: Date;

  constructor(
    message: string,
    limit: number,
    remaining: number,
    reset: Date
  ) {
    super(message, 429, 'rate_limit_exceeded');
    this.name = 'NeX7RateLimitError';
    this.limit = limit;
    this.remaining = remaining;
    this.reset = reset;
  }
}