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
  // Busca o arquivo produtos.csv solto na raiz do site-vascarin
  const csvFilePath = path.join(process.cwd(), 'data', 'produtos.csv'); 
  
  try {
    const file = fs.readFileSync(csvFilePath, 'utf8');
    
    const { data } = Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
    });

    return data.map((row: any) => ({
      id: row.id || Math.random().toString(36).substring(7),
      nome: row.nome || 'Produto sem nome',
      // Garante que o preço vire um número válido, aceitando vírgula ou ponto
      preco: parseFloat((row.preco || '0').toString().replace('R$', '').replace(',', '.').trim()),
      categoria: row.categoria || 'Geral',
      marca: row.marca || 'Vascarin Beauty', 
      imagem: row.imagem || '',
      descricao_resumida: row.descricao_resumida || '',
      descricao_completa: row.descricao_completa || '',
      // Se o estoque for maior que zero, mostra "Em Estoque", senão "Esgotado"
      disponibilidade: parseInt(row.estoque || '0') > 0 ? 'Em Estoque' : 'Esgotado',
    }));
  } catch (error) {
    console.error("Erro ao ler o arquivo CSV:", error);
    return [];
  }
}