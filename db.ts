import Dexie, { Table } from 'dexie';
import { Project, Expense, Category, ExpenseType, Task, Product } from './types';

// Define the database type including Dexie methods and custom tables
export type ObraControlDB = Dexie & {
  projects: Table<Project, number>;
  expenses: Table<Expense, number>;
  categories: Table<Category, number>;
  tasks: Table<Task, number>;
  products: Table<Product, number>;
};

// Create the database instance and cast it to our type
const db = new Dexie('ObraControlDB') as ObraControlDB;

// Define the new list of categories based on user requirements
const constructionCategories = [
  { name: 'Mão de Obra (Pedreiro/Servente/Mestre)', type: ExpenseType.LABOR },
  { name: 'Mão de Obra Especializada (Elétrica/Hidráulica)', type: ExpenseType.LABOR },
  { name: 'Engenharia e Arquitetura', type: ExpenseType.SERVICE },
  { name: 'Barracão+lig. provisórias(água/luz)+projetos/aprovs.', type: ExpenseType.OTHER },
  { name: 'Infraestrutura (estacas, brocas, baldrames, sapatas)', type: ExpenseType.MATERIAL },
  { name: 'Supraestrutura (Vigas, pilares, cintas, escadas)', type: ExpenseType.MATERIAL },
  { name: 'Paredes e Painéis', type: ExpenseType.MATERIAL },
  { name: 'Esquadrias', type: ExpenseType.MATERIAL },
  { name: 'Vidros e Plásticos', type: ExpenseType.MATERIAL },
  { name: 'Coberturas (estrutura e telhas)', type: ExpenseType.MATERIAL },
  { name: 'Impermeabilizações', type: ExpenseType.MATERIAL },
  { name: 'Revestimentos Internos', type: ExpenseType.MATERIAL },
  { name: 'Forros', type: ExpenseType.MATERIAL },
  { name: 'Revestimentos Externos', type: ExpenseType.MATERIAL },
  { name: 'Pinturas', type: ExpenseType.MATERIAL },
  { name: 'Pisos', type: ExpenseType.MATERIAL },
  { name: 'Acabamentos (soleiras, rodapés, peitoril etc.)', type: ExpenseType.MATERIAL },
  { name: 'Instalações Elétricas e Telefônicas', type: ExpenseType.MATERIAL },
  { name: 'Instalações Hidráulicas', type: ExpenseType.MATERIAL },
  { name: 'Instalações: Esgoto e Águas Pluviais', type: ExpenseType.MATERIAL },
  { name: 'Louças e Metais', type: ExpenseType.MATERIAL },
  { name: 'Complementos (limpeza final e calafete)', type: ExpenseType.SERVICE },
];

const initialProducts: Product[] = [
    { storeId: 'loja_exemplo', name: 'Cimento CP II 50kg', unit: 'saco', price: 32.90, category: 'Supraestrutura', lastUpdated: new Date().toISOString() },
    { storeId: 'loja_exemplo', name: 'Areia Média Lavada', unit: 'm³', price: 140.00, category: 'Infraestrutura', lastUpdated: new Date().toISOString() },
    { storeId: 'loja_exemplo', name: 'Tijolo Baiano 9x19x29', unit: 'milheiro', price: 850.00, category: 'Paredes', lastUpdated: new Date().toISOString() },
    { storeId: 'loja_exemplo', name: 'Tinta Acrílica Branca 18L', unit: 'lata', price: 380.00, category: 'Pinturas', lastUpdated: new Date().toISOString() },
    { storeId: 'loja_exemplo', name: 'Piso Porcelanato 60x60', unit: 'm²', price: 69.90, category: 'Pisos', lastUpdated: new Date().toISOString() },
    { storeId: 'loja_exemplo', name: 'Vergalhão 3/8 (10mm)', unit: 'barra', price: 45.00, category: 'Supraestrutura', lastUpdated: new Date().toISOString() },
];

// Define schema versions
db.version(1).stores({
  projects: '++id, name, createdAt',
  expenses: '++id, projectId, categoryId, date, status',
  categories: '++id, name, type'
});

// Upgrade to Version 2: Replace old categories with the new specific list
db.version(2).stores({
  projects: '++id, name, createdAt',
  expenses: '++id, projectId, categoryId, date, status',
  categories: '++id, name, type'
}).upgrade(async tx => {
  await tx.table('categories').clear();
  await tx.table('categories').bulkAdd(constructionCategories);
});

// Version 3: Add Tasks table
db.version(3).stores({
  projects: '++id, name, createdAt',
  expenses: '++id, projectId, categoryId, date, status',
  categories: '++id, name, type',
  tasks: '++id, projectId, isDone'
});

// Version 4: Add Products table for Marketplace
db.version(4).stores({
  projects: '++id, name, createdAt',
  expenses: '++id, projectId, categoryId, date, status',
  categories: '++id, name, type',
  tasks: '++id, projectId, isDone',
  products: '++id, storeId, name, category, price'
}).upgrade(async tx => {
    // Seed initial marketplace data
    await tx.table('products').bulkAdd(initialProducts);
});

// Populate initial data for new installations
db.on('populate', () => {
  db.categories.bulkAdd(constructionCategories);
  db.products.bulkAdd(initialProducts);
});

export { db };