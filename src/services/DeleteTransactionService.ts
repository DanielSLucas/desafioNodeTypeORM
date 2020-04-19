import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const userExists = await transactionsRepository.findOne({ id });

    if (!userExists) {
      throw new AppError('Users doesn`t exist');
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
