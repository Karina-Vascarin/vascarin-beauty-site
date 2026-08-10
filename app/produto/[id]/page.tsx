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
  // Ajuste o caminho dependendo de onde o produtos.csv está salvo!
  // Se estiver na raiz do projeto: 'produtos.csv'. Se estiver na pasta data: 'data/produtos.csv'
  const csvFilePath = path.join(process.cwd(), 'produtos.csv'); 
  
  try {
    const file = fs.readFileSync(csvFilePath, 'utf8');
    
    const { data } = Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
    });

    return data.map((row: any) => ({
      // Traduzindo as colunas do CSV para o que o site da Vascarin Beauty precisa:
      id: row['SKU'] || Math.random().toString(36).substring(7),
      nome: row['Nome'] || '',
      // Limpando o "R$" e transformando a vírgula em ponto para o sistema entender como número
      preco: parseFloat((row['Venda'] || '0').toString().replace('R$', '').replace(',', '.').trim()),
      categoria: row['Categoria'] || '',
      marca: 'Brand Collection', 
      imagem: row['Imagem'] || '',
      descricao_resumida: row['Nome de cadastro'] || '',
      descricao_completa: `Fragrância: ${row['Nome de cadastro']}. Produto premium de alta fixação.`,
      disponibilidade: parseInt(row['Estoque'] || '0') > 0 ? 'Em Estoque' : 'Esgotado',
    }));
  } catch (error) {
    console.error("Erro ao ler o arquivo CSV:", error);
    return [];
  }
}