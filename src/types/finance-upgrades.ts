// ===== New Finance Upgrades Types =====

export interface ReceiptScan {
    id: string;
    userId: string;
    transactionId?: string; // Link to a created transaction
    merchantName: string;
    totalAmount: number;
    date: Date;
    lineItems: ReceiptItem[];
    imageUrl: string;
    status: 'pending' | 'processed' | 'failed';
    createdAt: Date;
}

export interface ReceiptItem {
    description: string;
    amount: number;
    quantity?: number;
}

export interface AutoRule {
    id: string;
    userId: string;
    name: string;
    isActive: boolean;
    conditions: RuleCondition[];
    actions: RuleAction[];
    lastTriggeredAt?: Date;
    matchType: 'all' | 'any'; // Match all vs match any conditions
    createdAt: Date;
}

export interface RuleCondition {
    field: 'description' | 'amount' | 'merchant' | 'account';
    operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than';
    value: string | number;
}

export interface RuleAction {
    type: 'categorize' | 'add_tag' | 'flag_review' | 'link_goal';
    value: string; // The category name, tag string, or goal ID to apply
}

export interface Debt {
    id: string;
    userId: string;
    name: string;
    type: 'credit_card' | 'student_loan' | 'mortgage' | 'auto_loan' | 'personal' | 'other';
    totalAmount: number; // Original amount or limit
    currentBalance: number;
    interestRate: number; // APY percentage
    minimumPayment: number;
    dueDate: Date; // Next due date
    strategy: 'avalanche' | 'snowball' | 'custom'; // Paying down strategy
    isPaidOff: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface InvestmentPortfolio {
    id: string;
    userId: string;
    name: string;
    type: 'stocks' | 'crypto' | 'real_estate' | 'retirement' | 'other';
    holdings: InvestmentHolding[];
    totalValue: number;
    costBasis: number; // Total amount invested
    lastUpdated: Date;
    createdAt: Date;
}

export interface InvestmentHolding {
    symbol: string; // e.g., AAPL, BTC
    name: string; // e.g., Apple Inc, Bitcoin
    shares: number;
    averagePrice: number; // Average cost per share
    currentPrice: number;
    lastUpdated: Date;
}
