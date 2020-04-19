import Transaction from '../models/Transaction';

class ImportTransactionsService {
  async execute(transactions: object[]): Promise<Transaction[]> {
    for (let i = 1; i <= transactions.length; i++) {}
  }
}

export default ImportTransactionsService;
