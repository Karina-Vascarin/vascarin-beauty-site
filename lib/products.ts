import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export interface Product {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  marca: string;
  imagem: string;
  descricao_resumida: string;
  descricao_completa: string;
  disponibilidade: string;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const csvFilePath = path.join(process.cwd(), 'produtos.csv'); 
    
    if (!fs.existsSync(csvFilePath)) {
      console.warn("Arquivo produtos.csv não encontrado no diretório.");
      return [];
    }

    const file = fs.readFileSync(csvFilePath, 'utf8');
    
    const { data } = Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
    });

    return data.map((row: any) => ({
      id: row['SKU'] || Math.random().toString(36).substring(7),
      nome: row['Nome'] || '',
      preco: parseFloat((row['Venda'] || '0').toString().replace('R$', '').replace(',', '.').trim()) || 0,
      categoria: row['Categoria'] || '',
      marca: 'Brand Collection', 
      imagem: row['Imagem'] || '',
      descricao_resumida: row['Nome de cadastro'] || '',
      descricao_completa: `Fragrância: ${row['Nome de cadastro'] || ''}. Produto premium de alta fixação.`,
      disponibilidade: parseInt(row['Estoque'] || '0') > 0 ? 'Em Estoque' : 'Esgotado',
    }));
  } catch (error) {
    console.error("Erro ao ler o arquivo CSV:", error);
    return [];
  }
}