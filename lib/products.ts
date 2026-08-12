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
  estoque: number;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const csvFilePath = path.join(process.cwd(), 'produtos.csv'); 
    
    if (!fs.existsSync(csvFilePath)) {
      return [];
    }

    let file = fs.readFileSync(csvFilePath, 'utf8').replace(/^\uFEFF/, '');
    const isSemicolon = file.indexOf(';') > -1 && file.indexOf(';') < file.indexOf('\n');

    const { data } = Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: isSemicolon ? ';' : ',',
      transformHeader: (header) => header.trim()
    });

    return data.map((row: any, index: number) => {
      const precoRaw = row['preco'] || row['Venda'] || '0';
      const precoLimpo = precoRaw.toString().replace('R$', '').replace(',', '.').trim();
      
      const estoqueRaw = row['estoque'] !== undefined && row['estoque'] !== '' ? row['estoque'] : '5';
      const estoqueNum = parseInt(estoqueRaw);

      const nomeProduto = row['nome'] || '';
      const idProduto = row['id'] || row['SKU'] || '';

      // Identificação inteligente da categoria se a coluna da planilha estiver vazia
      let categoriaReal = row['categoria'];
      if (!categoriaReal || categoriaReal.trim() === '') {
        if (idProduto.toUpperCase().includes('BRAND') || nomeProduto.toLowerCase().includes('brand')) {
          categoriaReal = 'Brand Collection';
        } else {
          categoriaReal = 'Importados';
        }
      }

      // Identificação da marca
      let marcaReal = row['marca'];
      if (!marcaReal || marcaReal.trim() === '') {
        marcaReal = categoriaReal === 'Brand Collection' ? 'Brand Collection' : 'Vascarin Beauty';
      }

      return {
        id: idProduto || `produto-${index}`,
        nome: nomeProduto,
        preco: parseFloat(precoLimpo) || 0,
        categoria: categoriaReal.trim(),
        marca: marcaReal.trim(), 
        imagem: row['imagem'] || '',
        descricao_resumida: row['descricao_resumida'] || '',
        descricao_completa: row['descricao_completa'] || `Fragrância: ${nomeProduto}.`,
        estoque: isNaN(estoqueNum) ? 5 : estoqueNum,
      };
    });
  } catch (error) {
    console.error("Erro ao ler o arquivo CSV:", error);
    return [];
  }
}