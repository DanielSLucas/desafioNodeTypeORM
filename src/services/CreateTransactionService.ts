// import AppError from '../errors/AppError';
import { getRepository, getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const categoryExists = await categoryRepository.findOne({
      where: { category },
    });

    let newCategory: Category;

    if (!categoryExists) {
      newCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(newCategory);
    } else {
      newCategory = categoryExists;
    }

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Not enought cash!');
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: newCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
