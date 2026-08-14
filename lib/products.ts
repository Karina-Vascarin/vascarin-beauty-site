export async function getProducts() {
  const PLANILHA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSEBFXb1d_7KFNXVBxCiclQcVy4_EhBITqtjFDqxvCm4_fHhB5z6mshvP41Vkqck8LB0lvL7rffu7zw/pub?gid=0&single=true&output=csv";

  try {
    const response = await fetch(PLANILHA_URL, { 
      cache: 'no-store',
      next: { revalidate: 0 } 
    });
    
    if (!response.ok) {
      throw new Error("Não foi possível acessar a planilha online.");
    }
    
    const csvText = await response.text();

    const linhas = csvText.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (linhas.length === 0) return [];

    const separador = linhas[0].includes(';') ? ';' : ',';
    
    const parseLine = (linha: string) => {
      const resultado = [];
      let celula = '';
      let dentroDeAspas = false;
      for (let i = 0; i < linha.length; i++) {
        const char = linha[i];
        if (char === '"' && linha[i+1] === '"') {
          celula += '"';
          i++;
        } else if (char === '"') {
          dentroDeAspas = !dentroDeAspas;
        } else if (char === separador && !dentroDeAspas) {
          resultado.push(celula);
          celula = '';
        } else {
          celula += char;
        }
      }
      resultado.push(celula);
      return resultado;
    };

    const cabecalhosRaw = parseLine(linhas[0]);
    const cabecalhos = cabecalhosRaw.map(c => 
      c.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    const produtos = linhas.slice(1).map((linha, index) => {
      const valores = parseLine(linha);
      const produto: any = { id: `prod_${index}` };
      
      cabecalhos.forEach((cabecalho, idx) => {
        let valor = (valores[idx] || '').trim();
        
        if (cabecalho.includes('nome') || cabecalho.includes('produto')) {
          produto.nome = valor;
        } 
        else if (cabecalho.includes('preco') || cabecalho.includes('valor') || cabecalho === 'preco atual') {
          const numeroLimpo = valor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
          produto.preco = Number(numeroLimpo) || 0;
        } 
        else if (cabecalho.includes('estoque') || cabecalho.includes('quantidade') || cabecalho.includes('qtd')) {
          produto.estoque = Number(valor) || 0;
          produto.quantidade = Number(valor) || 0;
        } 
        else if (cabecalho.includes('imagem') || cabecalho.includes('foto') || cabecalho.includes('img')) {
          produto.imagem = valor;
        } 
        else if (cabecalho.includes('categoria') || cabecalho.includes('marca')) {
          produto.categoria = valor;
        } 
        else {
          produto[cabecalho] = valor;
        }
      });
      
      return produto;
    });

    return produtos;

  } catch (error) {
    console.error("Erro ao ler a planilha do Google Sheets:", error);
    return []; 
  }
}