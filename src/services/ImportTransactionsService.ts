import { getRepository, getCustomRepository, In } from 'typeorm';
import fs from 'fs';
import csv from 'csv-parse';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const readStream = fs.createReadStream(filePath);

    const parser = csv({
      from_line: 2,
    });

    const parseCSV = readStream.pipe(parser);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (title || type || value) return;

      categories.push(category);

      transactions.push(title, type, value, category);
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;

// FAIL SOLUTION :(

// const transactionsJSON: string[][] = [];

// await fs
//   .createReadStream(`${uploadConfig.directory}/${filePath}`)
//   .pipe(csv())
//   .on('data', async data => transactionsJSON.push(data))
//   .on('end', () => transactionsJSON);

// const transactionsRepository = getCustomRepository(TransactionsRepository);

// for (let i = 1; i <= transactionsJSON.length; i += 1) {
//   const csvLine = transactionsJSON[i];

//   const transaction = transactionsRepository.create({
//     title: csvLine[0],
//     type: csvLine[1],
//     value: csvLine[2],
//     category: csvLine[3],
//   });

//   newTransactions.push(transaction);
//   await transactionsRepository.save(transaction);
// }

// return newTransactions;
